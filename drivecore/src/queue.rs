//! Kalıcı olmaya uygun yükleme kuyruğu durum makinesi.
//! Zaman dışarıdan verilir (testlenebilir). Saklama (SQLite) üstte yapılır.
use std::collections::HashMap;

pub type JobId = u64;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum State {
    Pending,
    Uploading { confirmed: u64 },
    /// Hata sonrası `retry_at` (sn) zamanından önce denenmez.
    Failed { attempts: u32, retry_at: u64, error: String },
    /// Tekrar deneme hakkı bitti; kullanıcı müdahalesi gerekir.
    Dead { error: String },
    Done,
}

#[derive(Debug, Clone)]
pub struct Job { pub id: JobId, pub account: String, pub path: String, pub size: u64, pub attempts: u32, pub state: State }

pub struct Queue {
    jobs: HashMap<JobId, Job>,
    next_id: JobId,
    pub max_attempts: u32,
    /// Hesap başına aynı anda yükleyen iş sayısı: bir hesap diğerini tıkamaz.
    pub per_account_parallel: usize,
}

pub fn backoff_secs(attempts: u32) -> u64 { (5u64 << attempts.min(6)).min(300) }

impl Queue {
    pub fn new() -> Self { Queue { jobs: HashMap::new(), next_id: 1, max_attempts: 8, per_account_parallel: 3 } }

    pub fn add(&mut self, account: &str, path: &str, size: u64) -> JobId {
        let id = self.next_id; self.next_id += 1;
        self.jobs.insert(id, Job { id, account: account.into(), path: path.into(), size, attempts: 0, state: State::Pending });
        id
    }

    /// Şu an başlatılabilecek işler (hesap sınırı ve bekleme süreleri gözetilerek), eski olan önce.
    pub fn ready(&self, now: u64) -> Vec<JobId> {
        let mut running: HashMap<&str, usize> = HashMap::new();
        for j in self.jobs.values() {
            if matches!(j.state, State::Uploading { .. }) { *running.entry(&j.account).or_default() += 1; }
        }
        let mut cand: Vec<&Job> = self.jobs.values().filter(|j| match &j.state {
            State::Pending => true,
            State::Failed { retry_at, .. } => *retry_at <= now,
            _ => false,
        }).collect();
        cand.sort_by_key(|j| j.id);
        let mut out = vec![];
        for j in cand {
            let r = running.entry(&j.account).or_default();
            if *r < self.per_account_parallel { *r += 1; out.push(j.id); }
        }
        out
    }

    pub fn start(&mut self, id: JobId) { if let Some(j) = self.jobs.get_mut(&id) { j.state = State::Uploading { confirmed: 0 }; } }
    pub fn progress(&mut self, id: JobId, confirmed: u64) {
        if let Some(j) = self.jobs.get_mut(&id) { j.state = State::Uploading { confirmed }; }
    }
    pub fn complete(&mut self, id: JobId) { if let Some(j) = self.jobs.get_mut(&id) { j.state = State::Done; } }

    pub fn fail(&mut self, id: JobId, now: u64, error: &str) {
        let max = self.max_attempts;
        if let Some(j) = self.jobs.get_mut(&id) {
            j.attempts += 1;
            let attempts = j.attempts;
            j.state = if attempts >= max { State::Dead { error: error.into() } }
                else { State::Failed { attempts, retry_at: now + backoff_secs(attempts), error: error.into() } };
        }
    }

    /// Uygulama kapanıp açılınca: "Uploading" kalmış işler yarım kalmıştır, yeniden denenecek.
    pub fn recover_after_restart(&mut self) {
        for j in self.jobs.values_mut() { if matches!(j.state, State::Uploading { .. }) { j.state = State::Pending; } }
    }

    /// Kullanıcı "tekrar dene" derse ölü işleri geri alır.
    pub fn retry_dead(&mut self) {
        for j in self.jobs.values_mut() { if matches!(j.state, State::Dead { .. }) { j.attempts = 0; j.state = State::Pending; } }
    }

    pub fn jobs(&self) -> Vec<Job> { let mut v: Vec<Job> = self.jobs.values().cloned().collect(); v.sort_by_key(|j| j.id); v }
    pub fn get(&self, id: JobId) -> Option<&Job> { self.jobs.get(&id) }
    pub fn summary(&self) -> (usize, usize, usize, usize) {
        let mut s = (0, 0, 0, 0);
        for j in self.jobs.values() { match j.state {
            State::Pending => s.0 += 1, State::Uploading { .. } => s.1 += 1,
            State::Failed { .. } | State::Dead { .. } => s.2 += 1, State::Done => s.3 += 1 } }
        s // (bekleyen, yükleyen, hatalı, biten)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn per_account_limit_isolates_accounts() {
        let mut q = Queue::new(); q.per_account_parallel = 2;
        let a: Vec<_> = (0..5).map(|i| q.add("A", &format!("a{i}"), 1)).collect();
        let b = q.add("B", "b0", 1);
        let r = q.ready(0);
        assert_eq!(r.iter().filter(|id| a.contains(id)).count(), 2);
        assert!(r.contains(&b));
    }
    #[test]
    fn failure_backs_off_then_dies() {
        let mut q = Queue::new(); q.max_attempts = 3;
        let id = q.add("A", "x", 1);
        q.start(id); q.fail(id, 100, "net");
        assert!(q.ready(100).is_empty());
        assert_eq!(q.ready(100 + backoff_secs(1)), vec![id]);
        q.start(id); q.fail(id, 200, "net");
        q.start(id); q.fail(id, 300, "net");
        assert!(matches!(q.get(id).unwrap().state, State::Dead { .. }));
        assert!(q.ready(10_000).is_empty());
        q.retry_dead(); assert_eq!(q.ready(0), vec![id]);
    }
    #[test]
    fn restart_requeues_interrupted_uploads() {
        let mut q = Queue::new();
        let id = q.add("A", "x", 10); q.start(id); q.progress(id, 5);
        q.recover_after_restart();
        assert_eq!(q.get(id).unwrap().state, State::Pending);
    }
}

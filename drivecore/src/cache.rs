//! Yerelde indirilmiş (hydrated) dosyaların indeksi ve "Önbelleği temizle" planlayıcısı.
//! Gerçek silme/dehydrate işlemini platform katmanı (Cloud Files API / Android) yapar;
//! burası hangi dosyaların yer açılacağına karar verir.
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Entry { pub size: u64, pub last_access: u64, pub pinned: bool, pub dirty: bool }

#[derive(Default)]
pub struct CacheIndex { entries: HashMap<String, Entry> } // anahtar: "hesap:yol"

#[derive(Debug, Clone, Copy)]
pub enum Scope<'a> {
    /// Sabitlenmemiş ve yüklenmiş her şey.
    All,
    /// Belirli bir klasör altı (anahtar öneki).
    Prefix(&'a str),
    /// `before` (sn) tarihinden önce son erişilenler.
    OlderThan(u64),
}

impl CacheIndex {
    pub fn record(&mut self, key: &str, size: u64, now: u64) {
        let e = self.entries.entry(key.into()).or_insert(Entry { size, last_access: now, pinned: false, dirty: false });
        e.size = size; e.last_access = now;
    }
    pub fn touch(&mut self, key: &str, now: u64) { if let Some(e) = self.entries.get_mut(key) { e.last_access = now; } }
    pub fn set_pinned(&mut self, key: &str, v: bool) { if let Some(e) = self.entries.get_mut(key) { e.pinned = v; } }
    /// Yerelde değişmiş ve henüz buluta çıkmamış dosya ASLA temizlenmez (veri kaybı olur).
    pub fn set_dirty(&mut self, key: &str, v: bool) { if let Some(e) = self.entries.get_mut(key) { e.dirty = v; } }
    pub fn total_bytes(&self) -> u64 { self.entries.values().map(|e| e.size).sum() }

    fn evictable(e: &Entry) -> bool { !e.pinned && !e.dirty }

    /// "Önbelleği temizle" düğmesi: kapsama giren, güvenle yer açılabilecek dosyalar.
    pub fn plan_clear(&self, scope: Scope) -> Vec<String> {
        let mut v: Vec<_> = self.entries.iter().filter(|(k, e)| Self::evictable(e) && match scope {
            Scope::All => true,
            Scope::Prefix(p) => k.starts_with(p),
            Scope::OlderThan(t) => e.last_access < t,
        }).map(|(k, _)| k.clone()).collect();
        v.sort(); v
    }

    /// Hesap limiti aşılınca otomatik: en eski erişilenden başlayarak `limit` altına inene dek.
    pub fn plan_evict_to_limit(&self, limit: u64) -> Vec<String> {
        let mut total = self.total_bytes();
        if total <= limit { return vec![]; }
        let mut cand: Vec<_> = self.entries.iter().filter(|(_, e)| Self::evictable(e)).collect();
        cand.sort_by_key(|(k, e)| (e.last_access, (*k).clone()));
        let mut out = vec![];
        for (k, e) in cand { if total <= limit { break; } total -= e.size; out.push(k.clone()); }
        out
    }

    /// Platform dehydrate'i başarıyla bitirince çağrılır.
    pub fn remove(&mut self, key: &str) { self.entries.remove(key); }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn idx() -> CacheIndex {
        let mut c = CacheIndex::default();
        c.record("A:/2026/a.jpg", 100, 10);
        c.record("A:/2026/b.jpg", 200, 20);
        c.record("B:/x.jpg", 300, 30);
        c
    }
    #[test]
    fn clear_all_skips_pinned_and_dirty() {
        let mut c = idx(); c.set_pinned("A:/2026/a.jpg", true); c.set_dirty("B:/x.jpg", true);
        assert_eq!(c.plan_clear(Scope::All), vec!["A:/2026/b.jpg"]);
    }
    #[test]
    fn clear_by_prefix_and_age() {
        let c = idx();
        assert_eq!(c.plan_clear(Scope::Prefix("A:")).len(), 2);
        assert_eq!(c.plan_clear(Scope::OlderThan(25)), vec!["A:/2026/a.jpg", "A:/2026/b.jpg"]);
    }
    #[test]
    fn evicts_oldest_until_under_limit() {
        let c = idx(); // toplam 600
        assert_eq!(c.plan_evict_to_limit(350), vec!["A:/2026/a.jpg", "A:/2026/b.jpg"]);
        assert!(c.plan_evict_to_limit(600).is_empty());
    }
}

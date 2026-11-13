//! Google Drive resumable upload için parça planlayıcı.
//! Kural: son parça hariç her parça 256 KiB'ın katı olmalı.
pub const GRANULARITY: u64 = 256 * 1024;
pub const DEFAULT_CHUNK: u64 = 8 * 1024 * 1024;

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Chunk { pub start: u64, pub end_inclusive: u64, pub total: u64 }

impl Chunk {
    pub fn len(&self) -> u64 { self.end_inclusive - self.start + 1 }
    /// `Content-Range` başlığı değeri.
    pub fn content_range(&self) -> String {
        format!("bytes {}-{}/{}", self.start, self.end_inclusive, self.total)
    }
}

/// Sunucunun onayladığı bayt sayısından (`Range: bytes=0-N` → confirmed = N+1) sonraki parçayı üretir.
pub fn next_chunk(total: u64, confirmed: u64, chunk_size: u64) -> Option<Chunk> {
    if confirmed >= total { return None; }
    let size = (chunk_size / GRANULARITY).max(1) * GRANULARITY;
    let end = (confirmed + size).min(total) - 1;
    Some(Chunk { start: confirmed, end_inclusive: end, total })
}

/// Kesilen yüklemeyi sorgulayınca gelen `Range` başlığını ("bytes=0-524287") onaylı bayt sayısına çevirir.
/// Başlık yoksa hiç bayt alınmamıştır.
pub fn parse_confirmed(range_header: Option<&str>) -> Option<u64> {
    match range_header {
        None => Some(0),
        Some(h) => h.strip_prefix("bytes=")?.split('-').nth(1)?.parse::<u64>().ok().map(|n| n + 1),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn chunks_cover_file_exactly() {
        let total = 20 * 1024 * 1024 + 123;
        let (mut pos, mut n) = (0, 0);
        while let Some(c) = next_chunk(total, pos, DEFAULT_CHUNK) {
            assert_eq!(c.start, pos);
            if c.end_inclusive + 1 < total { assert_eq!(c.len() % GRANULARITY, 0); }
            pos = c.end_inclusive + 1; n += 1;
        }
        assert_eq!(pos, total); assert_eq!(n, 3);
    }
    #[test]
    fn odd_chunk_size_is_rounded_down() {
        let c = next_chunk(10_000_000, 0, 1_000_000).unwrap();
        assert_eq!(c.len(), 786_432);
    }
    #[test]
    fn resume_parsing() {
        assert_eq!(parse_confirmed(None), Some(0));
        assert_eq!(parse_confirmed(Some("bytes=0-524287")), Some(524_288));
        assert_eq!(parse_confirmed(Some("garbage")), None);
    }
    #[test]
    fn content_range_format() {
        assert_eq!(next_chunk(1000, 0, DEFAULT_CHUNK).unwrap().content_range(), "bytes 0-999/1000");
    }
}

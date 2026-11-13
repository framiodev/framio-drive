//! drivecore: Windows ve Android'in paylaşacağı Drive istemci çekirdeği.
//! Saf mantık (kuyruk, önbellek, yükleme planı) std-only; ağ katmanı `net` özelliğinde.
pub mod cache;
pub mod queue;
pub mod upload;

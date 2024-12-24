use std::path::PathBuf;

/// git http server config
#[derive(Clone,Debug)]
pub struct GitHttpConfig {
    /// git repository root
    pub root: PathBuf,
    /// git http server port
    pub port: u16,
    /// git http server address
    pub addr: String,
}

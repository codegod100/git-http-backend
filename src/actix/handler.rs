use crate::config::GitHttpConfig;
use crate::GitConfig;
use async_trait::async_trait;
use std::path::PathBuf;
use tracing::info;

#[derive(Clone, Debug)]
pub struct ActixGitHttp {
    pub config: GitHttpConfig,
}

#[async_trait]
impl GitConfig for ActixGitHttp {
    async fn rewrite(&self, path: String) -> PathBuf {
        let clean_path = path.trim_start_matches('/');
        info!(
            "Using config: {:#?} and joining with path: {}",
            &self.config.root, clean_path
        );
        let buf = PathBuf::from(&self.config.root).join(clean_path);
        info!("Rewritten path: {}", buf.display());
        buf
    }
}

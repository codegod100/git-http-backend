#![warn(clippy::doc_markdown, missing_debug_implementations)]
#![doc = include_str!("../README.md")]

/// The configuration module
pub mod config;

/// The actix module
pub mod actix;

use async_trait::async_trait;
use std::path::PathBuf;
pub use {actix::handler::ActixGitHttp, actix::router as actix_git_router};

#[async_trait]
pub trait GitConfig {
    /// Rewrite the path
    async fn rewrite(&self, path: String) -> PathBuf;
}

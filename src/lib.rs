#![warn(
    clippy::doc_markdown,
    missing_debug_implementations,
    rust_2018_idioms,
    missing_docs
)]
#![doc = include_str!("../README.md")]


/// The configuration module
pub mod config;

/// The actix module
pub mod actix;
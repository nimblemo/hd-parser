use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Gate {
    pub name: String,
    pub description: String,
    pub lines: HashMap<String, String>,
    pub crosses: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub center: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub across: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fear: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sexuality: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub love: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub business: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Channel {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetaObject {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Center {
    pub name: String,
    pub normal: String,
    pub distorted: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PhsBlock {
    pub colors: HashMap<String, String>,
    pub tones: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GatesDatabase {
    pub gates: HashMap<String, Gate>,
    pub channels: HashMap<String, Channel>,
    pub centers: HashMap<String, Center>,
    pub types: HashMap<String, MetaObject>,
    pub profiles: HashMap<String, MetaObject>,
    pub authorities: HashMap<String, MetaObject>,
    pub crosses: HashMap<String, MetaObject>,
    pub diet: PhsBlock,
    pub motivation: PhsBlock,
    pub vision: PhsBlock,
    pub environment: PhsBlock,
}

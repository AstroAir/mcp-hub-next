use serde::{Deserialize, Serialize};
use std::{collections::HashSet, process::Command, sync::{Mutex, OnceLock}};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallationSource { Npm, Github, Local }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryServerEntry {
    pub id: String,
    pub name: String,
    pub description: String,
    pub source: InstallationSource,
    pub package_name: Option<String>,
    pub repository: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub documentation: Option<String>,
    pub tags: Option<Vec<String>>,
    pub downloads: Option<u64>,
    pub stars: Option<u64>,
    pub last_updated: Option<String>,
    pub verified: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistrySearchFilters { pub query: Option<String>, pub source: Option<String>, pub tags: Option<Vec<String>>, pub verified: Option<bool>, pub sort_by: Option<String>, pub limit: Option<u32>, pub offset: Option<u32> }

static CACHE: OnceLock<Mutex<Vec<RegistryServerEntry>>> = OnceLock::new();
fn cache() -> &'static Mutex<Vec<RegistryServerEntry>> { CACHE.get_or_init(|| Mutex::new(vec![])) }

fn known_servers() -> Vec<RegistryServerEntry> {
    let known = [
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-github",
        "@modelcontextprotocol/server-postgres",
        "@modelcontextprotocol/server-sqlite",
        "@modelcontextprotocol/server-slack",
        "@modelcontextprotocol/server-brave-search",
        "@modelcontextprotocol/server-puppeteer",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-fetch",
        "@modelcontextprotocol/server-google-maps",
    ];
    known.iter().map(|pkg| {
        let name = pkg.trim_start_matches("@modelcontextprotocol/server-");
        RegistryServerEntry{ id: pkg.to_string(), name: name[0..1].to_uppercase()+&name[1..], description: format!("Official MCP {} server", name), source: InstallationSource::Npm, package_name: Some(pkg.to_string()), repository: None, version: None, author: None, homepage: Some("https://github.com/modelcontextprotocol/servers".into()), documentation: Some(format!("https://github.com/modelcontextprotocol/servers/tree/main/src/{}", name)), tags: Some(vec!["official".into(), "mcp".into(), name.into()]), downloads: None, stars: None, last_updated: None, verified: Some(true) }
    }).collect()
}

fn search_npm(query: Option<&str>) -> Vec<RegistryServerEntry> {
    let q = query.unwrap_or("mcp-server");
    let output = Command::new("npm").args(["search", q, "--json", "--long"]).output();
    if let Ok(out) = output {
        if out.status.success() {
            if let Ok(text) = String::from_utf8(out.stdout) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(arr) = json.as_array() {
                        return arr.iter().filter_map(|pkg| {
                            let name = pkg.get("name")?.as_str()?.to_string();
                            // Filter mcp related
                            let is_mcp = name.contains("mcp") || pkg.get("keywords").and_then(|k| k.as_array()).map(|ks| ks.iter().any(|kw| kw.as_str().map(|s| s.contains("mcp") || s.contains("model-context-protocol")).unwrap_or(false))).unwrap_or(false);
                            if !is_mcp { return None; }
                            Some(RegistryServerEntry {
                                id: name.clone(),
                                name: name.clone(),
                                description: pkg.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                                source: InstallationSource::Npm,
                                package_name: Some(name.clone()),
                                repository: None,
                                version: pkg.get("version").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                author: pkg.get("author").and_then(|a| a.get("name")).and_then(|v| v.as_str()).map(|s| s.to_string()),
                                homepage: pkg.get("links").and_then(|l| l.get("homepage")).and_then(|v| v.as_str()).map(|s| s.to_string()),
                                documentation: pkg.get("links").and_then(|l| l.get("repository")).and_then(|v| v.as_str()).map(|s| s.to_string()),
                                tags: pkg.get("keywords").and_then(|v| v.as_array()).map(|ks| ks.iter().filter_map(|k| k.as_str().map(|s| s.to_string())).collect()),
                                downloads: None,
                                stars: None,
                                last_updated: pkg.get("date").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                verified: Some(known_servers().iter().any(|k| k.id == name)),
                            })
                        }).collect();
                    }
                }
            }
        }
    }
    vec![]
}

fn update_cache() {
    let mut list = known_servers();
    let npm = search_npm(None);
    list.extend(npm);
    // TODO: GitHub search
    let mut map = cache().lock().unwrap();
    // de-duplicate by id
    let mut seen = HashSet::new();
    list.retain(|e| seen.insert(e.id.clone()));
    *map = list;
}

#[tauri::command]
pub fn registry_search(filters: RegistrySearchFilters) -> Result<(Vec<RegistryServerEntry>, u32, bool), String> {
    if cache().lock().unwrap().is_empty() { update_cache(); }
    let mut results = cache().lock().unwrap().clone();
    if let Some(q) = &filters.query { let q = q.to_lowercase(); results.retain(|s| s.name.to_lowercase().contains(&q) || s.description.to_lowercase().contains(&q) || s.tags.as_ref().map(|t| t.iter().any(|x| x.to_lowercase().contains(&q))).unwrap_or(false)); }
    if let Some(src) = &filters.source { results.retain(|s| match (src.as_str(), &s.source) { ("npm", InstallationSource::Npm) | ("github", InstallationSource::Github) | ("local", InstallationSource::Local) => true, _ => false }); }
    if let Some(v) = filters.verified { results.retain(|s| s.verified.unwrap_or(false) == v); }
    // sort
    if let Some(sort) = &filters.sort_by { match sort.as_str() { "downloads" => results.sort_by_key(|s| std::cmp::Reverse(s.downloads.unwrap_or(0))), "stars" => results.sort_by_key(|s| std::cmp::Reverse(s.stars.unwrap_or(0))), "updated" => results.sort_by_key(|s| std::cmp::Reverse(s.last_updated.clone().unwrap_or_default())), _ => results.sort_by(|a,b| a.name.cmp(&b.name)) } } else { results.sort_by(|a,b| a.name.cmp(&b.name)); }
    let total = results.len() as u32;
    let offset = filters.offset.unwrap_or(0) as usize;
    let limit = filters.limit.unwrap_or(20) as usize;
    let slice = if offset < results.len() { let end = (offset+limit).min(results.len()); results[offset..end].to_vec() } else { vec![] };
    let has_more = (offset + limit) < (total as usize);
    Ok((slice, total, has_more))
}

#[tauri::command]
pub fn registry_categories() -> Result<Vec<String>, String> {
    if cache().lock().unwrap().is_empty() { update_cache(); }
    let mut set: HashSet<String> = HashSet::new();
    for s in cache().lock().unwrap().iter() { if let Some(tags) = &s.tags { for t in tags { set.insert(t.clone()); } } }
    let mut v: Vec<String> = set.into_iter().collect();
    v.sort();
    Ok(v)
}

#[tauri::command]
pub fn registry_popular(limit: Option<u32>, source: Option<String>) -> Result<Vec<RegistryServerEntry>, String> {
    let (_, total, _) = registry_search(RegistrySearchFilters{ query: None, source, tags: None, verified: None, sort_by: Some("downloads".into()), limit, offset: Some(0) })?;
    // We ignore 'total' here and just return results from search
    let (servers, _, _) = registry_search(RegistrySearchFilters{ query: None, source: None, tags: None, verified: None, sort_by: Some("downloads".into()), limit, offset: Some(0) })?;
    Ok(servers)
}

#[tauri::command]
pub fn registry_refresh() -> Result<(), String> { update_cache(); Ok(()) }

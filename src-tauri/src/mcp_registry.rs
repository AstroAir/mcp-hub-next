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

fn search_github(query: Option<&str>) -> Vec<RegistryServerEntry> {
    let q = query.unwrap_or("mcp-server topic:mcp");

    // Attempt to use GitHub CLI for repository search
    let output = Command::new("gh")
        .args([
            "search", "repos", q,
            "--json", "name,owner,description,url,stargazersCount,updatedAt",
            "--limit", "50"
        ])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            if let Ok(text) = String::from_utf8(out.stdout) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(arr) = json.as_array() {
                        return arr.iter().filter_map(|repo| {
                            let name = repo.get("name")?.as_str()?;
                            let owner = repo.get("owner")?.get("login").and_then(|v| v.as_str())?;
                            let full_name = format!("{}/{}", owner, name);
                            let description = repo.get("description").and_then(|v| v.as_str()).unwrap_or("");

                            // Filter for MCP-related repositories
                            let name_lower = name.to_lowercase();
                            let desc_lower = description.to_lowercase();
                            let is_mcp = name_lower.contains("mcp")
                                || desc_lower.contains("mcp")
                                || desc_lower.contains("model context protocol");

                            if !is_mcp { return None; }

                            Some(RegistryServerEntry {
                                id: full_name.clone(),
                                name: name.to_string(),
                                description: description.to_string(),
                                source: InstallationSource::Github,
                                package_name: None,
                                repository: Some(full_name.clone()),
                                version: None,
                                author: Some(owner.to_string()),
                                homepage: repo.get("url").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                documentation: repo.get("url").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                tags: Some(vec!["github".to_string(), "mcp".to_string()]),
                                downloads: None,
                                stars: repo.get("stargazersCount").and_then(|v| v.as_u64()),
                                last_updated: repo.get("updatedAt").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                verified: Some(false),
                            })
                        }).collect();
                    }
                }
            }
        }
    }

    // GitHub CLI not available or search failed - return empty vec
    // Users can still install GitHub servers via direct repository URLs
    log::debug!("GitHub search not available (gh CLI not found or failed) - use direct repository URLs for GitHub servers");
    vec![]
}

fn update_cache() -> Result<(), String> {
    let mut list = known_servers();
    let npm = search_npm(None);
    list.extend(npm);
    let github = search_github(None);
    list.extend(github);
    let mut map = cache().lock().map_err(|_| "Cache lock poisoned".to_string())?;
    // de-duplicate by id
    let mut seen = HashSet::new();
    list.retain(|e| seen.insert(e.id.clone()));
    *map = list;
    Ok(())
}

#[tauri::command]
pub fn registry_search(filters: RegistrySearchFilters) -> Result<(Vec<RegistryServerEntry>, u32, bool), String> {
    if cache().lock().map_err(|_| "Cache lock poisoned".to_string())?.is_empty() { update_cache()?; }
    let mut results = cache().lock().map_err(|_| "Cache lock poisoned".to_string())?.clone();
    if let Some(q) = &filters.query { let q = q.to_lowercase(); results.retain(|s| s.name.to_lowercase().contains(&q) || s.description.to_lowercase().contains(&q) || s.tags.as_ref().map(|t| t.iter().any(|x| x.to_lowercase().contains(&q))).unwrap_or(false)); }
    if let Some(src) = &filters.source { results.retain(|s| matches!((src.as_str(), &s.source), ("npm", InstallationSource::Npm) | ("github", InstallationSource::Github) | ("local", InstallationSource::Local))); }
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
    if cache().lock().map_err(|_| "Cache lock poisoned".to_string())?.is_empty() { update_cache()?; }
    let mut set: HashSet<String> = HashSet::new();
    for s in cache().lock().map_err(|_| "Cache lock poisoned".to_string())?.iter() { if let Some(tags) = &s.tags { for t in tags { set.insert(t.clone()); } } }
    let mut v: Vec<String> = set.into_iter().collect();
    v.sort();
    Ok(v)
}

#[tauri::command]
pub fn registry_popular(limit: Option<u32>, source: Option<String>) -> Result<Vec<RegistryServerEntry>, String> {
    let (servers, _, _) = registry_search(RegistrySearchFilters{ query: None, source, tags: None, verified: None, sort_by: Some("downloads".into()), limit, offset: Some(0) })?;
    Ok(servers)
}

#[tauri::command]
pub fn registry_refresh() -> Result<(), String> { update_cache() }

#[cfg(test)]
mod tests {
    use super::*;

    /// Test known_servers returns expected official servers
    #[test]
    fn test_known_servers_count() {
        let servers = known_servers();
        assert_eq!(servers.len(), 10, "Should have 10 official MCP servers");
    }

    /// Test known_servers have correct properties
    #[test]
    fn test_known_servers_properties() {
        let servers = known_servers();

        for server in &servers {
            // All should be npm source
            assert!(matches!(server.source, InstallationSource::Npm));

            // All should be verified
            assert_eq!(server.verified, Some(true));

            // All should have package name starting with @modelcontextprotocol
            if let Some(pkg) = &server.package_name {
                assert!(pkg.starts_with("@modelcontextprotocol/"));
            }

            // All should have homepage
            assert!(server.homepage.is_some());

            // All should have documentation link
            assert!(server.documentation.is_some());

            // All should have tags
            assert!(server.tags.is_some());
            if let Some(tags) = &server.tags {
                assert!(tags.contains(&"official".to_string()));
                assert!(tags.contains(&"mcp".to_string()));
            }
        }
    }

    /// Test specific known server (filesystem)
    #[test]
    fn test_known_server_filesystem() {
        let servers = known_servers();
        let fs_server = servers.iter().find(|s| s.id == "@modelcontextprotocol/server-filesystem");

        assert!(fs_server.is_some());
        let server = fs_server.unwrap();
        assert_eq!(server.name, "Filesystem");
        assert_eq!(server.package_name, Some("@modelcontextprotocol/server-filesystem".to_string()));
        assert!(server.description.contains("filesystem"));
    }

    /// Test RegistryServerEntry serialization
    #[test]
    fn test_registry_server_entry_serde() {
        let entry = RegistryServerEntry {
            id: "test-server".to_string(),
            name: "Test Server".to_string(),
            description: "A test MCP server".to_string(),
            source: InstallationSource::Npm,
            package_name: Some("@test/server".to_string()),
            repository: Some("https://github.com/test/server".to_string()),
            version: Some("1.0.0".to_string()),
            author: Some("Test Author".to_string()),
            homepage: Some("https://test.com".to_string()),
            documentation: Some("https://docs.test.com".to_string()),
            tags: Some(vec!["test".to_string(), "mcp".to_string()]),
            downloads: Some(1000),
            stars: Some(50),
            last_updated: Some("2025-01-01".to_string()),
            verified: Some(true),
        };

        let json = serde_json::to_string(&entry).unwrap();
        let deserialized: RegistryServerEntry = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, "test-server");
        assert_eq!(deserialized.name, "Test Server");
        assert_eq!(deserialized.downloads, Some(1000));
        assert_eq!(deserialized.verified, Some(true));
    }

    /// Test InstallationSource enum variants
    #[test]
    fn test_installation_source_variants() {
        let sources = vec![
            InstallationSource::Npm,
            InstallationSource::Github,
            InstallationSource::Local,
        ];

        for source in sources {
            let json = serde_json::to_string(&source).unwrap();
            let deserialized: InstallationSource = serde_json::from_str(&json).unwrap();
            assert_eq!(
                std::mem::discriminant(&source),
                std::mem::discriminant(&deserialized)
            );
        }
    }

    /// Test RegistrySearchFilters default values
    #[test]
    fn test_search_filters_defaults() {
        let filters = RegistrySearchFilters {
            query: None,
            source: None,
            tags: None,
            verified: None,
            sort_by: None,
            limit: None,
            offset: None,
        };

        // Test serialization with all None values
        let json = serde_json::to_string(&filters).unwrap();
        let deserialized: RegistrySearchFilters = serde_json::from_str(&json).unwrap();

        assert!(deserialized.query.is_none());
        assert!(deserialized.source.is_none());
        assert!(deserialized.limit.is_none());
    }

    /// Test RegistrySearchFilters with all fields populated
    #[test]
    fn test_search_filters_populated() {
        let filters = RegistrySearchFilters {
            query: Some("filesystem".to_string()),
            source: Some("npm".to_string()),
            tags: Some(vec!["official".to_string()]),
            verified: Some(true),
            sort_by: Some("downloads".to_string()),
            limit: Some(10),
            offset: Some(5),
        };

        let json = serde_json::to_string(&filters).unwrap();
        let deserialized: RegistrySearchFilters = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.query, Some("filesystem".to_string()));
        assert_eq!(deserialized.limit, Some(10));
        assert_eq!(deserialized.offset, Some(5));
    }

    /// Test registry_search with empty cache (known servers only)
    #[test]
    #[serial_test::serial]
    fn test_registry_search_basic() {
        // Search with no filters should return results
        let filters = RegistrySearchFilters {
            query: None,
            source: None,
            tags: None,
            verified: None,
            sort_by: None,
            limit: Some(5),
            offset: Some(0),
        };

        let result = registry_search(filters);
        assert!(result.is_ok());

        let (servers, total, has_more) = result.unwrap();
        assert!(!servers.is_empty(), "Should have at least known servers");
        assert!(total >= 10, "Should have at least 10 known servers");
        assert_eq!(servers.len(), 5.min(total as usize), "Should respect limit");

        if total > 5 {
            assert!(has_more, "Should indicate more results available");
        }
    }

    /// Test registry_search with query filter
    #[test]
    #[serial_test::serial]
    fn test_registry_search_with_query() {
        let filters = RegistrySearchFilters {
            query: Some("filesystem".to_string()),
            source: None,
            tags: None,
            verified: None,
            sort_by: None,
            limit: None,
            offset: None,
        };

        let result = registry_search(filters);
        assert!(result.is_ok());

        let (servers, _, _) = result.unwrap();
        assert!(!servers.is_empty(), "Should find filesystem server");

        // Check that all results match the query
        for server in servers {
            let matches = server.name.to_lowercase().contains("filesystem")
                || server.description.to_lowercase().contains("filesystem")
                || server.tags.as_ref().map(|t|
                    t.iter().any(|tag| tag.to_lowercase().contains("filesystem"))
                ).unwrap_or(false);
            assert!(matches, "Server {} should match query 'filesystem'", server.name);
        }
    }

    /// Test registry_search with source filter
    #[test]
    #[serial_test::serial]
    fn test_registry_search_with_source_filter() {
        let filters = RegistrySearchFilters {
            query: None,
            source: Some("npm".to_string()),
            tags: None,
            verified: None,
            sort_by: None,
            limit: None,
            offset: None,
        };

        let result = registry_search(filters);
        assert!(result.is_ok());

        let (servers, _, _) = result.unwrap();

        // All results should be from npm
        for server in servers {
            assert!(matches!(server.source, InstallationSource::Npm));
        }
    }

    /// Test registry_search with verified filter
    #[test]
    #[serial_test::serial]
    fn test_registry_search_with_verified_filter() {
        let filters = RegistrySearchFilters {
            query: None,
            source: None,
            tags: None,
            verified: Some(true),
            sort_by: None,
            limit: None,
            offset: None,
        };

        let result = registry_search(filters);
        assert!(result.is_ok());

        let (servers, _, _) = result.unwrap();

        // All results should be verified
        for server in servers {
            assert_eq!(server.verified, Some(true));
        }
    }

    /// Test registry_search pagination
    #[test]
    #[serial_test::serial]
    fn test_registry_search_pagination() {
        // Get first page
        let filters1 = RegistrySearchFilters {
            query: None,
            source: None,
            tags: None,
            verified: None,
            sort_by: None,
            limit: Some(5),
            offset: Some(0),
        };

        let result1 = registry_search(filters1);
        assert!(result1.is_ok());
        let (page1, total, has_more1) = result1.unwrap();

        // Get second page
        let filters2 = RegistrySearchFilters {
            query: None,
            source: None,
            tags: None,
            verified: None,
            sort_by: None,
            limit: Some(5),
            offset: Some(5),
        };

        let result2 = registry_search(filters2);
        assert!(result2.is_ok());
        let (page2, _, has_more2) = result2.unwrap();

        // Pages should not overlap
        if total > 5 {
            assert!(has_more1);
            let page1_ids: Vec<_> = page1.iter().map(|s| &s.id).collect();
            let page2_ids: Vec<_> = page2.iter().map(|s| &s.id).collect();

            for id in page2_ids {
                assert!(!page1_ids.contains(&id), "Pages should not have overlapping IDs");
            }
        }

        // has_more should be false when at end
        if total <= 10 {
            assert!(!has_more2, "Should not have more results after page 2");
        }
    }

    /// Test registry_categories
    #[test]
    #[serial_test::serial]
    fn test_registry_categories() {
        let result = registry_categories();
        assert!(result.is_ok());

        let categories = result.unwrap();
        assert!(!categories.is_empty(), "Should have categories");

        // Should include "official" and "mcp" from known servers
        assert!(categories.contains(&"official".to_string()));
        assert!(categories.contains(&"mcp".to_string()));

        // Should be sorted
        let mut sorted = categories.clone();
        sorted.sort();
        assert_eq!(categories, sorted, "Categories should be sorted");
    }

    /// Test registry_popular
    #[test]
    #[serial_test::serial]
    fn test_registry_popular() {
        let result = registry_popular(Some(5), None);
        assert!(result.is_ok());

        let servers = result.unwrap();
        assert!(servers.len() <= 5, "Should respect limit");
    }
}

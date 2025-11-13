use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;

/// File filter for dialog
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

/// Open file dialog and return selected file path
#[tauri::command]
pub async fn open_file_dialog(
    app: AppHandle,
    title: Option<String>,
    filters: Option<Vec<FileFilter>>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut builder = app.dialog().file();
    
    if let Some(title) = title {
        builder = builder.set_title(&title);
    }
    
    if let Some(filters) = filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            builder = builder.add_filter(&filter.name, &extensions);
        }
    }

    let file = builder.blocking_pick_file();

    Ok(file.map(|f| f.to_string()))
}

/// Open multiple files dialog and return selected file paths
#[tauri::command]
pub async fn open_files_dialog(
    app: AppHandle,
    title: Option<String>,
    filters: Option<Vec<FileFilter>>,
) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut builder = app.dialog().file();
    
    if let Some(title) = title {
        builder = builder.set_title(&title);
    }
    
    if let Some(filters) = filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            builder = builder.add_filter(&filter.name, &extensions);
        }
    }

    let files = builder.blocking_pick_files();

    Ok(files
        .unwrap_or_default()
        .into_iter()
        .map(|f| f.to_string())
        .collect())
}

/// Save file dialog and return selected file path
#[tauri::command]
pub async fn save_file_dialog(
    app: AppHandle,
    title: Option<String>,
    default_name: Option<String>,
    filters: Option<Vec<FileFilter>>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut builder = app.dialog().file();
    
    if let Some(title) = title {
        builder = builder.set_title(&title);
    }
    
    if let Some(default_name) = default_name {
        builder = builder.set_file_name(&default_name);
    }
    
    if let Some(filters) = filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            builder = builder.add_filter(&filter.name, &extensions);
        }
    }

    let file = builder.blocking_save_file();

    Ok(file.map(|f| f.to_string()))
}

/// Open folder dialog and return selected folder path
#[tauri::command]
pub async fn open_folder_dialog(
    app: AppHandle,
    title: Option<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut builder = app.dialog().file();
    
    if let Some(title) = title {
        builder = builder.set_title(&title);
    }
    
    let folder = builder.blocking_pick_folder();

    Ok(folder.map(|f| f.to_string()))
}

/// Read file contents
#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write file contents
#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Read file as bytes
#[tauri::command]
pub async fn read_file_binary(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write file as bytes
#[tauri::command]
pub async fn write_file_binary(path: String, content: Vec<u8>) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Check if file exists
#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

/// Get file metadata
#[tauri::command]
pub async fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    Ok(FileMetadata {
        size: metadata.len(),
        is_file: metadata.is_file(),
        is_dir: metadata.is_dir(),
        modified: metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
        created: metadata
            .created()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub size: u64,
    pub is_file: bool,
    pub is_dir: bool,
    pub modified: Option<u64>,
    pub created: Option<u64>,
}

/// Show message dialog
#[tauri::command]
pub async fn show_message_dialog(
    app: AppHandle,
    title: String,
    message: String,
    kind: Option<String>,
) -> Result<(), String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    
    let kind = match kind.as_deref() {
        Some("info") => MessageDialogKind::Info,
        Some("warning") => MessageDialogKind::Warning,
        Some("error") => MessageDialogKind::Error,
        _ => MessageDialogKind::Info,
    };
    
    app.dialog()
        .message(message)
        .title(title)
        .kind(kind)
        .blocking_show();
    
    Ok(())
}

/// Show confirm dialog
#[tauri::command]
pub async fn show_confirm_dialog(
    app: AppHandle,
    title: String,
    message: String,
) -> Result<bool, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let result = app.dialog()
        .message(message)
        .title(title)
        .blocking_show();

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    /// Test FileFilter structure serialization
    #[test]
    fn test_file_filter_serde() {
        let filter = FileFilter {
            name: "Images".to_string(),
            extensions: vec!["jpg".to_string(), "png".to_string(), "gif".to_string()],
        };

        let json = serde_json::to_string(&filter).unwrap();
        let deserialized: FileFilter = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.name, "Images");
        assert_eq!(deserialized.extensions.len(), 3);
        assert_eq!(deserialized.extensions[0], "jpg");
    }

    /// Test FileMetadata structure
    #[test]
    fn test_file_metadata_structure() {
        let metadata = FileMetadata {
            size: 1024,
            is_file: true,
            is_dir: false,
            modified: Some(1609459200),
            created: Some(1609459200),
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: FileMetadata = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.size, 1024);
        assert!(deserialized.is_file);
        assert!(!deserialized.is_dir);
        assert_eq!(deserialized.modified, Some(1609459200));
    }

    /// Test file_exists with existing file
    #[test]
    fn test_file_exists_true() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        std::fs::write(&file_path, "test content").unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(file_exists(file_path.to_string_lossy().to_string()));

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    /// Test file_exists with non-existent file
    #[test]
    fn test_file_exists_false() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(file_exists("/nonexistent/file.txt".to_string()));

        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    /// Test read_file and write_file
    #[test]
    fn test_read_write_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test_rw.txt");
        let content = "Hello, World!\nThis is a test file.";

        let runtime = tokio::runtime::Runtime::new().unwrap();

        // Write file
        let write_result = runtime.block_on(write_file(
            file_path.to_string_lossy().to_string(),
            content.to_string(),
        ));
        assert!(write_result.is_ok());

        // Read file
        let read_result = runtime.block_on(read_file(file_path.to_string_lossy().to_string()));
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), content);
    }

    /// Test read_file with non-existent file
    #[test]
    fn test_read_file_error() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(read_file("/nonexistent/file.txt".to_string()));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read file"));
    }

    /// Test read_file_binary and write_file_binary
    #[test]
    fn test_read_write_binary() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test_binary.bin");
        let content: Vec<u8> = vec![0, 1, 2, 3, 255, 128, 64, 32];

        let runtime = tokio::runtime::Runtime::new().unwrap();

        // Write binary
        let write_result = runtime.block_on(write_file_binary(
            file_path.to_string_lossy().to_string(),
            content.clone(),
        ));
        assert!(write_result.is_ok());

        // Read binary
        let read_result = runtime.block_on(read_file_binary(file_path.to_string_lossy().to_string()));
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), content);
    }

    /// Test get_file_metadata for file
    #[test]
    fn test_get_file_metadata_for_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("metadata_test.txt");
        let content = "Test content";
        std::fs::write(&file_path, content).unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(get_file_metadata(file_path.to_string_lossy().to_string()));

        assert!(result.is_ok());
        let metadata = result.unwrap();
        assert_eq!(metadata.size, content.len() as u64);
        assert!(metadata.is_file);
        assert!(!metadata.is_dir);
        assert!(metadata.modified.is_some());
    }

    /// Test get_file_metadata for directory
    #[test]
    fn test_get_file_metadata_for_dir() {
        let temp_dir = TempDir::new().unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(get_file_metadata(temp_dir.path().to_string_lossy().to_string()));

        assert!(result.is_ok());
        let metadata = result.unwrap();
        assert!(!metadata.is_file);
        assert!(metadata.is_dir);
    }

    /// Test get_file_metadata error for non-existent file
    #[test]
    fn test_get_file_metadata_error() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(get_file_metadata("/nonexistent/path".to_string()));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to get file metadata"));
    }

    /// Test write and read UTF-8 content
    #[test]
    fn test_utf8_content() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("utf8_test.txt");
        let content = "Hello 世界 🌍 Привет";

        let runtime = tokio::runtime::Runtime::new().unwrap();

        let write_result = runtime.block_on(write_file(
            file_path.to_string_lossy().to_string(),
            content.to_string(),
        ));
        assert!(write_result.is_ok());

        let read_result = runtime.block_on(read_file(file_path.to_string_lossy().to_string()));
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), content);
    }

    /// Test empty file operations
    #[test]
    fn test_empty_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("empty.txt");

        let runtime = tokio::runtime::Runtime::new().unwrap();

        // Write empty file
        let write_result = runtime.block_on(write_file(
            file_path.to_string_lossy().to_string(),
            String::new(),
        ));
        assert!(write_result.is_ok());

        // Read empty file
        let read_result = runtime.block_on(read_file(file_path.to_string_lossy().to_string()));
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), "");

        // Check metadata
        let metadata_result = runtime.block_on(get_file_metadata(file_path.to_string_lossy().to_string()));
        assert!(metadata_result.is_ok());
        assert_eq!(metadata_result.unwrap().size, 0);
    }
}


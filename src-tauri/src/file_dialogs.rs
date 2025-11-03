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


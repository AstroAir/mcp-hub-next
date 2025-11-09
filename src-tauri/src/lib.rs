mod updates;
mod storage;
mod file_dialogs;
mod secure_storage;
mod mcp_lifecycle;
mod mcp_installer;
mod mcp_registry;

use updates::UpdateState;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(UpdateState::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(desktop)]
      {
        app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
        app.handle().plugin(tauri_plugin_dialog::init())?;
        app.handle().plugin(tauri_plugin_fs::init())?;

        // Launch embedded Next.js server then open the window once it's ready
        use std::{net::TcpStream, path::PathBuf, thread, time::Duration, process::Command};

        let app_handle = app.handle().clone();
        thread::spawn(move || {
          let port = std::env::var("TAURI_NEXT_PORT").unwrap_or_else(|_| "34115".to_string());

          // Resolve resource directory where we bundled .next and public
          let resource_dir: PathBuf = match app_handle.path().resource_dir() {
            Ok(p) => p,
            Err(e) => {
              log::error!("Failed to resolve resource_dir: {e}");
              return;
            }
          };

          // Node binary path (bundled), fallback to system 'node'
          #[cfg(target_os = "windows")]
          let node_name = "node.exe";
          #[cfg(not(target_os = "windows"))]
          let node_name = "node";
          let bundled_node = resource_dir.join("resources").join("node").join(node_name);
          let node_path = if bundled_node.exists() { bundled_node } else { PathBuf::from("node") };

          // Server entry (our small launcher written by scripts/tauri-build.js)
          let server_js = resource_dir.join("resources").join("server.js");
          if !server_js.exists() {
            log::error!("Server launcher not found at {:?}", server_js);
            return;
          }

          // Spawn the Next server
          let mut child = match Command::new(&node_path)
            .arg(&server_js)
            .env("PORT", &port)
            .current_dir(&resource_dir)
            .spawn()
          {
            Ok(c) => c,
            Err(e) => {
              log::error!("Failed to spawn Next server with {:?}: {}", node_path, e);
              return;
            }
          };

          // Wait for the port to be available
          let addr = format!("127.0.0.1:{}", port);
          let mut ready = false;
          for _ in 0..200 { // ~20s
            if TcpStream::connect(&addr).is_ok() { ready = true; break; }
            thread::sleep(Duration::from_millis(100));
          }
          if !ready {
            log::error!("Next server did not become ready at {}", addr);
            let _ = child.kill();
            return;
          }

          // Create the main window pointing to the local Next server
          let url = format!("http://{}", addr);
          match tauri::WebviewWindowBuilder::new(
            &app_handle,
            "main",
            tauri::WebviewUrl::External(url.parse().unwrap()),
          )
          .title("mcp-hub-next")
          .build() {
            Ok(win) => { let _ = win.set_focus(); },
            Err(e) => log::error!("Failed to create main window: {}", e),
          }

          // NOTE: We no longer hook an on-exit handler here (Tauri v2 has no AppHandle::on_exit).
          // If needed, we could listen for window events and kill the child then.
        });
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // Update commands
      updates::get_app_version,
      updates::get_update_preferences,
      updates::set_update_preferences,
      updates::get_update_status,
      updates::check_for_updates,
      updates::quit_and_install,
      // Storage commands
      storage::get_app_data_path,
      storage::save_servers,
      storage::load_servers,
      storage::save_chat_sessions,
      storage::load_chat_sessions,
      storage::save_settings,
      storage::load_settings,
      storage::save_connection_history,
      storage::load_connection_history,
      storage::save_backup,
      storage::load_backup,
      storage::delete_backup,
      storage::list_backups,
      storage::clear_all_data,
      // File dialog commands
      file_dialogs::open_file_dialog,
      file_dialogs::open_files_dialog,
      file_dialogs::save_file_dialog,
      file_dialogs::open_folder_dialog,
      file_dialogs::read_file,
      file_dialogs::write_file,
      file_dialogs::read_file_binary,
      file_dialogs::write_file_binary,
      file_dialogs::file_exists,
      file_dialogs::get_file_metadata,
      file_dialogs::show_message_dialog,
      file_dialogs::show_confirm_dialog,
      // Secure storage commands
      secure_storage::save_credential,
      secure_storage::get_credential,
      secure_storage::delete_credential,
      secure_storage::has_credential,
      secure_storage::save_oauth_token,
      secure_storage::get_oauth_token,
      secure_storage::delete_oauth_token,
      secure_storage::save_api_key,
      secure_storage::get_api_key,
      secure_storage::delete_api_key,
      secure_storage::save_encrypted_data,
      secure_storage::get_encrypted_data,
      secure_storage::delete_encrypted_data,
      secure_storage::clear_all_credentials,
      // MCP lifecycle
      mcp_lifecycle::mcp_start_server,
      mcp_lifecycle::mcp_stop_server,
      mcp_lifecycle::mcp_restart_server,
      mcp_lifecycle::mcp_get_status,
      mcp_lifecycle::mcp_list_running,
      // MCP installer
      mcp_installer::validate_install,
      mcp_installer::install_server,
      mcp_installer::get_install_progress,
      mcp_installer::cancel_install,
      mcp_installer::cleanup_install,
      // MCP registry
      mcp_registry::registry_search,
      mcp_registry::registry_categories,
      mcp_registry::registry_popular,
      mcp_registry::registry_refresh,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

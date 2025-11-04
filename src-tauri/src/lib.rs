mod updates;
mod storage;
mod file_dialogs;
mod secure_storage;
mod mcp_lifecycle;
mod mcp_installer;
mod mcp_registry;

use updates::UpdateState;

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

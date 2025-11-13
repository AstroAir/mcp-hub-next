# MCP Hub Next Documentation Index

## Standard Operating Procedures (SOP)

[Tauri Desktop Build Procedure](sop/tauri-desktop-build.md): Core build process and configuration for generating platform-specific installers. References multi-platform guide for comprehensive cross-OS build instructions.

[Multi-Platform Installer Build](sop/multi-platform-installer-build.md): Complete procedure for building desktop installers on Windows (MSI/NSIS), Linux (DEB/AppImage), and macOS (DMG/APP). Includes platform-specific prerequisites, CI/CD setup, and troubleshooting for common build issues.

[Adding Rust Tests to Tauri Backend](sop/adding-rust-tests.md): Step-by-step SOP for writing unit tests in Tauri Rust modules, covering test design, serialization testing, global state handling with serial_test, temporary file usage, and patterns for each module.

[Adding Translatable Strings](sop/adding-translatable-strings.md): Procedure for adding new user-facing strings to the i18n system, including translation file updates, component implementation, locale testing, and ensuring key parity between English and Chinese translations.

[Responsive Component Development](sop/responsive-component-development.md): Standard for building mobile-first responsive components with Tailwind CSS breakpoints, ensuring WCAG 2.5 Level AAA touch target compliance (44px minimum on mobile) and testing procedures across mobile/tablet/desktop viewports.

[Testing Layout Components](sop/testing-layout-components.md): Testing infrastructure and procedures for nine core layout components (AppSidebar, Navbar, SiteHeader, Breadcrumbs, BreadcrumbProvider, KeyboardShortcuts, ShortcutsHelp, CleanupHandler, ThemeBridge) with 189 comprehensive unit tests covering rendering, user interactions, Zustand store integration, accessibility, and keyboard event handling.

## Features

[Tauri Desktop Integration](feature/tauri-integration.md): Architecture of desktop application bundling, process lifecycle management via Rust, and runtime detection patterns for conditional Tauri command invocation.

[IDE Configuration Support](feature/ide-config-support.md): Seamless integration with existing IDE configurations from Claude Desktop, VSCode extensions (MCP, Cline, Continue), including discovery, validation, import/export of server configurations, and client type tracking for workflow portability across development environments.

[Rust Backend Improvements](feature/rust-backend-improvements.md): Comprehensive improvements to the Tauri Rust backend including elimination of 8 unsafe unwrap() calls, TypeScript/Rust type system alignment, completion of 4 missing features (installation cancellation, GitHub search, credential registry, error reporting), installation metadata persistence with automatic disk backup, and quality improvements achieving 99 passing tests with zero clippy warnings.

[MCP Server Uninstallation System](feature/mcp-server-uninstallation.md): Complete uninstallation workflow with persistent installation metadata tracking, source-specific cleanup (npm/github/local), process lifecycle integration, and comprehensive error handling. Provides `uninstall_server` command with automatic process termination, package manager integration, metadata cleanup, and cross-session uninstallation support via persistent storage.

[Tauri Rust Backend Testing Infrastructure](feature/tauri-rust-testing.md): Comprehensive unit test framework covering 99 tests across seven modules (installer, registry, lifecycle, file I/O, secure storage, updates, storage), with test dependencies, running procedures, module coverage details, and testing best practices for metadata persistence and validation.

[Internationalization (i18n) System](feature/internationalization-system.md): Multi-language support architecture using next-intl with English and Simplified Chinese, key organization patterns, component localization guidelines, translation file structure, and developer patterns for adding new translatable strings.

[Auto-Update System](feature/auto-update-system.md): Complete update lifecycle from detection through installation including configurable auto-download/auto-install preferences, startup checks, real-time progress tracking, event emission to frontend, and preference persistence across app restarts.

[Mobile Responsiveness](feature/mobile-responsiveness.md): Mobile-first responsive design implementation across UI components with Tailwind CSS breakpoints, touch target sizing (44px minimum on mobile), responsive scroll areas, text label hiding patterns, sidebar/drawer components, and breakpoint strategy from 320px mobile to 1920px+ desktop.

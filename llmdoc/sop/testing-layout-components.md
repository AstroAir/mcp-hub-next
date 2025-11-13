# Testing Layout Components

## 1. Purpose

This document outlines the testing infrastructure and procedures for React components in the `components/layout/` directory. These components comprise the core UI shell including navigation (AppSidebar, Navbar), content hierarchy (Breadcrumbs), keyboard shortcuts handling, theme management, and cleanup logic. Comprehensive unit tests ensure component stability, accessibility compliance, and integration with Zustand stores and i18n systems.

## 2. Test Coverage and Implementation

### Components Under Test

Eight layout components have complete test coverage:

- **AppSidebar** (`app-sidebar.tsx`, 295 lines in test) - Main sidebar navigation with active route detection and i18n integration
- **Navbar** (`navbar.tsx`) - Top navigation bar with locale switching and dynamic menus
- **SiteHeader** (`site-header.tsx`) - Page header component with breadcrumbs and title rendering
- **Breadcrumbs** (`breadcrumbs.tsx`) - Navigation hierarchy display with link routing
- **BreadcrumbProvider** (`breadcrumb-provider.tsx`) - React Context for managing breadcrumb state across app
- **KeyboardShortcuts** (`keyboard-shortcuts.tsx`) - Global keyboard event handler with command palette integration
- **ShortcutsHelp** (`shortcuts-help.tsx`) - Dialog displaying available keyboard shortcuts reference
- **CleanupHandler** (`cleanup-handler.tsx`) - Component lifecycle cleanup for resource management
- **ThemeBridge** (`theme-bridge.tsx`) - Theme provider integration with client-side hydration safety

### Test Statistics

- **Total Tests**: 189 tests across all layout components
- **Test Files**: 9 colocated test files in `components/layout/`
- **Pass Rate**: 100% (all tests passing)
- **Testing Framework**: Jest with React Testing Library
- **Coverage Areas**:
  - Component rendering with various props
  - User interactions (clicks, keyboard events, form submissions)
  - Conditional rendering and edge cases
  - Zustand store integration (mocked appropriately)
  - Props validation and combinations
  - Error and loading states
  - Accessibility (ARIA attributes, keyboard navigation)
  - Event handling and cleanup
  - State management via Context providers

### Test File Structure

Each test file follows this pattern:

```
components/layout/[component-name].test.tsx
├── jest-environment declaration (@jest-environment jsdom)
├── Imports (testing-library/react, component, mocks)
├── Mock definitions
│   ├── next/link, next/navigation
│   ├── Zustand stores (useUIStore, useSettingsStore, etc.)
│   ├── UI component primitives
│   └── External dependencies
├── describe() suite per component
├── beforeEach() setup/cleanup
└── it() test cases
    ├── Rendering tests
    ├── User interaction tests
    ├── Props variation tests
    └── Integration tests
```

### Mocking Strategy

- **Next.js modules**: Mock `next/link` as `<a>` tag, `next/navigation` hooks as return values
- **Zustand stores**: Create mock store instances with controlled state updates
- **UI Primitives**: Mock shadcn/ui sidebar/button/dialog components as simple divs/buttons with props
- **External utilities**: Mock i18n (`useTranslations`), hooks (`useRouter`, `usePathname`)

### Common Test Patterns

**Rendering**:
```typescript
it('renders without crashing', () => {
  const { container } = render(<Component />);
  expect(container).toBeInTheDocument();
});
```

**User Interaction**:
```typescript
it('handles click events', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(mockCallback).toHaveBeenCalled();
});
```

**Store Integration**:
```typescript
it('reads from Zustand store', () => {
  const mockStore = { state: 'value' };
  jest.mocked(useUIStore).mockReturnValue(mockStore);
  render(<Component />);
  expect(screen.getByText('value')).toBeInTheDocument();
});
```

**Keyboard Events**:
```typescript
it('handles keyboard shortcuts', () => {
  render(<Component />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(mockHandler).toHaveBeenCalled();
});
```

### Running Tests

**All layout tests**:
```bash
pnpm test components/layout/
```

**Specific component**:
```bash
pnpm test components/layout/app-sidebar.test.tsx
```

**Watch mode**:
```bash
pnpm test:watch components/layout/
```

**Coverage report**:
```bash
pnpm test:coverage components/layout/
```

## 3. Relevant Code Modules

- `/components/layout/app-sidebar.tsx` - Main navigation sidebar
- `/components/layout/navbar.tsx` - Top navigation bar
- `/components/layout/site-header.tsx` - Page header with breadcrumbs
- `/components/layout/breadcrumbs.tsx` - Breadcrumb navigation display
- `/components/layout/breadcrumb-provider.tsx` - Breadcrumb context provider
- `/components/layout/keyboard-shortcuts.tsx` - Global keyboard event handling
- `/components/layout/shortcuts-help.tsx` - Keyboard shortcuts reference dialog
- `/components/layout/cleanup-handler.tsx` - Component lifecycle cleanup
- `/components/layout/theme-bridge.tsx` - Theme provider integration
- `/lib/stores/index.ts` - Zustand store exports
- `/lib/utils/shortcuts.ts` - Keyboard shortcut utility functions
- `/lib/hooks/use-command-palette.ts` - Command palette hook

## 4. Attention

- Tests use `@jest-environment jsdom` for DOM environment; verify this pragma exists in all layout test files
- Mock Zustand stores at the top-level test file; do not mix real store usage with mocks as it causes state leakage
- KeyboardShortcuts tests require mocking `useRouter` from `next/navigation` to prevent navigation in test environment
- Breadcrumb tests mock Next.js Link component to avoid routing during tests; ensure href validation happens in test mocks
- ShortcutsHelp and KeyboardShortcuts components depend on settingsStore; always mock `useSettingsStore().shortcuts` to provide test data

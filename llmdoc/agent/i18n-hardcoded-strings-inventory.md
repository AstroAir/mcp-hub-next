# i18n Hardcoded Strings Inventory and Fix Guide

## Overview

This document catalogs all hardcoded user-facing strings found during the i18n audit and provides specific fixes for achieving 100% translation coverage.

---

## 1. Navigation Component Hardcoded Strings

### Issue 1.1: App Sidebar Navigation Labels

**File:** `components/layout/app-sidebar.tsx`
**Lines:** 24-50
**Severity:** CRITICAL
**Status:** 5 hardcoded labels affecting main navigation

**Current Code:**
```typescript
const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: Store,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Developer",
    url: "/developer",
    icon: Bug,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]
```

**Problem:** All five navigation labels are hardcoded English strings. No translation function is used.

**Required Fix:**
1. Add `'use client'` directive at top (already present, but verify)
2. Import `useTranslations` from `'next-intl'`
3. Call `const t = useTranslations('common.navigation');` inside component
4. Replace static array with dynamic rendering or use translation keys
5. Map navigation items to existing translation keys:
   - "Dashboard" → `t('dashboard')`
   - "Marketplace" → `t('marketplace')`
   - "Chat" → `t('chat')`
   - "Developer" → `t('developer')`
   - "Settings" → `t('settings')`

**Proposed Implementation:**
```typescript
'use client';

import { useTranslations } from 'next-intl';
// ... other imports ...

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const t = useTranslations('common.navigation');

  const navItems = [
    {
      title: t('dashboard'),
      url: "/",
      icon: Home,
    },
    {
      title: t('marketplace'),
      url: "/marketplace",
      icon: Store,
    },
    {
      title: t('chat'),
      url: "/chat",
      icon: MessageSquare,
    },
    {
      title: t('developer'),
      url: "/developer",
      icon: Bug,
    },
    {
      title: t('settings'),
      url: "/settings",
      icon: Settings,
    },
  ];

  // ... rest of component ...
}
```

**Translation Keys Status:** ✓ Available in both `en.json` and `zh-CN.json`

---

### Issue 1.2: Navbar Navigation Labels

**File:** `components/layout/navbar.tsx`
**Lines:** 14-19
**Severity:** CRITICAL
**Status:** 4 hardcoded labels

**Current Code:**
```typescript
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/developer', label: 'Developer', icon: Bug },
  { href: '/settings', label: 'Settings', icon: Settings },
];
```

**Problem:** Same issue as sidebar - English labels hardcoded, but missing "Marketplace" and "Servers" items.

**Required Fix:**
Same approach as sidebar - convert to use `useTranslations()` hook with translation keys.

**Proposed Implementation:**
```typescript
'use client';

import { useTranslations } from 'next-intl';
// ... other imports ...

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('common.navigation');

  const navItems = [
    { href: '/', label: t('dashboard'), icon: Home },
    { href: '/chat', label: t('chat'), icon: MessageSquare },
    { href: '/developer', label: t('developer'), icon: Bug },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  // ... rest of component ...
}
```

**Translation Keys Status:** ✓ Available in both `en.json` and `zh-CN.json`

---

### Issue 1.3: Brand Name Hardcoding

**Files:**
- `components/layout/app-sidebar.tsx`, line 74
- `components/layout/navbar.tsx`, line 31

**Severity:** MEDIUM
**Current Code:**
```typescript
// app-sidebar.tsx
<span className="text-base font-semibold">MCP Hub</span>

// navbar.tsx
<span>MCP Hub</span>
```

**Problem:** Brand name appears hardcoded in two locations with no translation key.

**Decision Required:**
- Is "MCP Hub" a proper noun/brand that should remain English?
- Or should it be added as a translatable string (unlikely for brand names)?

**Recommendation:** Create a config constant or translation key `metadata.appName` for consistency. Most professional applications keep brand names in English, but the key should exist for flexibility.

**Proposed Solution:**
Option A (Keep as brand - recommended):
```typescript
const APP_NAME = 'MCP Hub';
<span className="text-base font-semibold">{APP_NAME}</span>
```

Option B (Translate if desired):
```typescript
const t = useTranslations('metadata');
<span className="text-base font-semibold">{t('appName')}</span>
// Add to messages:
// "metadata": { "appName": "MCP Hub" }
```

---

## 2. Accessibility Hardcoded Strings

### Issue 2.1: Site Header aria-label

**File:** `components/layout/site-header.tsx`
**Line:** 30
**Severity:** HIGH
**Impact:** Screen readers announce hardcoded English to all users

**Current Code:**
```typescript
<Link
  href="/"
  className="hover:text-foreground transition-colors flex-shrink-0"
  aria-label="Home"
>
```

**Problem:** `aria-label="Home"` is hardcoded. Should be localized for accessibility.

**Recommended Fix:**
```typescript
'use client';

import { useTranslations } from 'next-intl';
// ... other imports ...

export function SiteHeader() {
  const t = useTranslations('common.a11y');
  const { items } = useBreadcrumbs();

  return (
    <header className="...">
      <SidebarTrigger className="-ml-1" />
      <Separator ... />
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <nav className="...">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex-shrink-0"
            aria-label={t('home') || 'Home'}
          >
            <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>
          {/* ... rest of breadcrumbs ... */}
        </nav>
      </div>
    </header>
  );
}
```

**Translation Key Status:**
- `common.a11y` section exists but only has `"more": "More options"`
- Need to add: `"home": "Home"` or use `"dashboard"` from `common.navigation`

**Proposed Addition to en.json and zh-CN.json:**
```json
{
  "common": {
    "a11y": {
      "more": "More options",
      "home": "Home"
    }
  }
}
```

**Chinese Translation (zh-CN.json):**
```json
{
  "common": {
    "a11y": {
      "more": "更多选项",
      "home": "首页"
    }
  }
}
```

---

## 3. Missing Translation Keys (62 Total)

### Issue 3.1: Marketplace Section (47 Missing Keys)

**Affected Files:**
- `messages/zh-CN.json` - completely missing marketplace section
- Components likely using these: `components/marketplace/marketplace-*.tsx`

**Missing Keys List:**

#### Filters (13 keys):
```
marketplace.filters.searchPlaceholder
marketplace.filters.sort.placeholder
marketplace.filters.sort.options.stars
marketplace.filters.sort.options.downloads
marketplace.filters.sort.options.updated
marketplace.filters.sort.options.name
marketplace.filters.category.placeholder
marketplace.filters.category.all
marketplace.filters.tags.button
marketplace.filters.tags.dropdownLabel
marketplace.filters.quickFilters.recommended
marketplace.filters.quickFilters.noApiKey
marketplace.filters.reset
```

#### Card Display (10 keys):
```
marketplace.card.badges.recommended
marketplace.card.author
marketplace.card.stats.stars
marketplace.card.stats.downloads
marketplace.card.stats.requiresApiKey
marketplace.card.buttons.github
marketplace.card.buttons.install
marketplace.card.buttons.installing
marketplace.card.buttons.details
marketplace.card.dialog.installing
```

#### Toasts (4 keys):
```
marketplace.toasts.parseRepository
marketplace.toasts.installing
marketplace.toasts.installStartFailed
marketplace.toasts.installed
```

#### Details (6 keys):
```
marketplace.detail.stats.updated
marketplace.detail.meta.category
marketplace.detail.meta.tags
marketplace.detail.mcpId.label
marketplace.detail.mcpId.copied
marketplace.detail.mcpId.copy
```

#### Actions (2 keys):
```
marketplace.detail.actions.viewOnGitHub
marketplace.detail.readme.title
```

#### View (12 keys):
```
marketplace.view.title
marketplace.view.subtitle
marketplace.view.actions.refresh
marketplace.view.actions.resetFilters
marketplace.view.states.errorTitle
marketplace.view.states.errorDescription
marketplace.view.states.emptyTitle
marketplace.view.states.emptyDescription
marketplace.view.stats.resultCount
```

**Required Action:** Add all 47 keys to `messages/zh-CN.json` with Chinese translations matching the structure in `messages/en.json` (lines 142-219).

**Example Translation (from en.json):**
```json
{
  "marketplace": {
    "filters": {
      "searchPlaceholder": "Search MCP servers..."
    }
  }
}
```

**Chinese Example:**
```json
{
  "marketplace": {
    "filters": {
      "searchPlaceholder": "搜索 MCP 服务器..."
    }
  }
}
```

---

### Issue 3.2: Chat Message Section (15 Missing Keys)

**Affected Files:** `messages/zh-CN.json` - missing message-related keys
**Component:** `components/chat/chat-message.tsx` and related

**Missing Keys List:**

#### Attachments (3 keys):
```
chat.message.attachmentsCount
chat.message.attachmentIcon
```

#### PDF Preview (3 keys):
```
chat.message.previewPdf
chat.message.previewButton
chat.message.pdfPreviewTitle
```

#### Tooltips (2 keys):
```
chat.message.previewTooltip
chat.message.downloadTooltip
```

#### Image Preview (1 key):
```
chat.message.imagePreviewAlt
```

#### Tool Calls (7 keys):
```
chat.message.toolCall.title
chat.message.toolCall.parameters
chat.message.toolCall.response
chat.message.toolCall.unknownError
chat.message.toolCall.status.requested
chat.message.toolCall.status.success
chat.message.toolCall.status.error
```

#### Tool Result (2 keys):
```
chat.message.toolResult.title
chat.message.toolResult.error
```

#### Interface Status (1 key):
```
chat.interface.status.streaming
```

**Required Action:** Add all 15 keys to `messages/zh-CN.json` lines following existing chat section (currently ends at line 275).

**Example Translations (from en.json):**
```json
{
  "chat": {
    "message": {
      "attachmentsCount": "{count, plural, one {# attachment} other {# attachments}}",
      "attachmentIcon": "Attachment icon",
      "previewPdf": "Preview PDF",
      "toolCall": {
        "title": "Tool call: {name}",
        "parameters": "Parameters",
        "response": "Response"
      }
    }
  }
}
```

**Chinese Examples:**
```json
{
  "chat": {
    "message": {
      "attachmentsCount": "{count, plural, one {# 个附件} other {# 个附件}}",
      "attachmentIcon": "附件图标",
      "previewPdf": "预览 PDF",
      "toolCall": {
        "title": "工具调用：{name}",
        "parameters": "参数",
        "response": "响应"
      }
    }
  }
}
```

---

## 4. Service Layer Error Messages

### Issue 4.1: MCP Client Service Errors

**File:** `lib/services/mcp-client.ts`
**Lines:** 63-64
**Severity:** MEDIUM

**Current Code:**
```typescript
const error = new Error(
  `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`
);
```

**Problem:** Error message is hardcoded. Not localized.

**Current Usage:** Caught in UI components and shown via toast notifications.

**Recommended Solution:**
1. Replace error message with standard error code
2. Handle localization in UI layer where toast is shown

**Proposed Fix:**
```typescript
const error = new Error('RATE_LIMIT_EXCEEDED');
(error as any).code = 'RATE_LIMIT_EXCEEDED';
(error as any).retryAfter = result.retryAfter;
```

**UI Layer Translation (in components):**
```typescript
catch (error: any) {
  if (error.message === 'RATE_LIMIT_EXCEEDED') {
    toast.error(t('errors.rateLimitExceeded', {
      seconds: error.retryAfter
    }));
  }
}
```

**Add Translation Keys:**
```json
{
  "common": {
    "errors": {
      "rateLimitExceeded": "Rate limit exceeded. Retry after {seconds} seconds."
    }
  }
}
```

---

### Issue 4.2: Backup Service Errors

**File:** `lib/services/backup-service.ts`
**Lines:** 88, 330
**Severity:** MEDIUM

**Current Code:**
```typescript
// Line 88
throw new Error('Backups can only be created in browser environment');

// Line 330
throw new Error('Invalid backup file format');
```

**Problem:** Two hardcoded error messages in service layer.

**Recommended Solution:** Same as 4.1 - use error codes instead of messages.

**Proposed Fix:**
```typescript
// Line 88
throw new Error('BACKUP_BROWSER_ONLY');

// Line 330
throw new Error('BACKUP_INVALID_FORMAT');
```

**Add Translation Keys:**
```json
{
  "settings": {
    "backup": {
      "errors": {
        "browserOnly": "Backups can only be created in browser environment",
        "invalidFormat": "Invalid backup file format"
      }
    }
  }
}
```

---

## 5. Locale Support Inconsistency

### Issue 5.1: Unsupported Locales in Settings UI

**File:** `messages/en.json`
**Lines:** 408-411
**Severity:** HIGH

**Current Code:**
```json
"locale": {
  "options": {
    "en": "English",
    "zh-CN": "Chinese (Simplified)",
    "ja": "Japanese",
    "es": "Spanish"
  }
}
```

**Problem:** Settings allows selecting Japanese and Spanish, but translation files don't exist:
- `messages/ja.json` - NOT FOUND
- `messages/es.json` - NOT FOUND

**Impact:** Users selecting these locales will see English text throughout the app.

**Routing Configuration:** `i18n/routing.ts` only defines:
```typescript
export const locales = ["en", "zh-CN"] as const;
```

**Recommended Solution:**

Option A (Recommended): Remove unsupported locales from UI
- Remove ja and es from `messages/en.json` and `messages/zh-CN.json`
- Only show English and Chinese options
- Update routing to confirm locales match

Option B: Add missing translation files
- Create `messages/ja.json` and `messages/es.json`
- Translate all 1632 keys to Japanese and Spanish
- Update routing configuration to include new locales

**Proposed Fix (Option A):**

In `messages/en.json` (lines 408-411):
```json
"locale": {
  "options": {
    "en": "English",
    "zh-CN": "Chinese (Simplified)"
  }
}
```

In `messages/zh-CN.json` (lines 308-316):
```json
"locale": {
  "options": {
    "en": "英语",
    "zh-CN": "简体中文"
  }
}
```

---

## Summary Table

| Issue | Type | File(s) | Keys Affected | Severity | Status |
|-------|------|---------|---------------|----------|--------|
| Sidebar Nav Labels | Hardcoded | app-sidebar.tsx | 5 strings | CRITICAL | Not Localized |
| Navbar Labels | Hardcoded | navbar.tsx | 4 strings | CRITICAL | Not Localized |
| Header aria-label | Hardcoded | site-header.tsx | 1 string | HIGH | Not Localized |
| Brand Name | Hardcoded | app-sidebar.tsx, navbar.tsx | 2 instances | MEDIUM | Decision Needed |
| Marketplace Section | Missing Keys | zh-CN.json | 47 keys | CRITICAL | 0% Translated |
| Chat Messages | Missing Keys | zh-CN.json | 15 keys | HIGH | 0% Translated |
| Service Errors | Hardcoded | mcp-client.ts, backup-service.ts | 3 instances | MEDIUM | Not Localized |
| Unsupported Locales | Config Mismatch | en.json, zh-CN.json | UI Settings | HIGH | Inconsistent |

---

## Implementation Checklist

- [ ] Update `components/layout/app-sidebar.tsx` - Add i18n to navigation
- [ ] Update `components/layout/navbar.tsx` - Add i18n to navigation
- [ ] Update `components/layout/site-header.tsx` - Localize aria-label
- [ ] Add 47 marketplace keys to `messages/zh-CN.json`
- [ ] Add 15 chat message keys to `messages/zh-CN.json`
- [ ] Add 1 home aria-label key to both message files
- [ ] Resolve locale options (remove ja/es or create translation files)
- [ ] Refactor service error messages to use error codes
- [ ] Add error message translation keys to message files
- [ ] Test all UI in both English and Chinese locales
- [ ] Run full i18n coverage audit to verify 100% completion


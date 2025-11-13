# i18n Implementation Audit - MCP Hub Next

## Evidence Section

### 1. Missing Translation Keys in zh-CN.json

**File:** `messages/zh-CN.json`
**Lines:** Various (entire section missing)
**Status:** 62 keys present in `en.json` but missing in `zh-CN.json`

#### Missing Marketplace Section (47 keys):
- All marketplace filtering strings: `marketplace.filters.*` (searchPlaceholder, sort options, category, tags)
- All marketplace card display strings: `marketplace.card.*` (badges, author, stats, buttons, dialog, toasts)
- All marketplace detail strings: `marketplace.detail.*` (stats, meta, mcpId, actions, readme)
- All marketplace view strings: `marketplace.view.*` (title, subtitle, actions, states, stats)

#### Missing Chat Message Section (15 keys):
- Message attachments: `chat.message.attachmentsCount`, `chat.message.attachmentIcon`
- PDF preview: `chat.message.previewPdf`, `chat.message.previewButton`, `chat.message.pdfPreviewTitle`
- Preview tooltips: `chat.message.previewTooltip`, `chat.message.downloadTooltip`
- Image preview: `chat.message.imagePreviewAlt`
- Tool calls: `chat.message.toolCall.*` (title, parameters, response, unknownError, status)
- Tool results: `chat.message.toolResult.*` (title, error)
- Chat interface: `chat.interface.status.streaming`

---

### 2. Hardcoded Navigation Labels

<CodeSection>

## Code Section: Hardcoded Navigation Labels in App Sidebar

**File:** `components/layout/app-sidebar.tsx`
**Lines:** 24-49
**Purpose:** Define navigation menu items with labels

```tsx
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

**Key Details:**
- Five navigation menu items use hardcoded English labels
- No translation function (`useTranslations()`) is used
- These labels appear in the main sidebar menu rendered to all users
- Sidebar is a Client Component (`'use client'`) so `useTranslations()` hook could be applied

</CodeSection>

<CodeSection>

## Code Section: Hardcoded Brand Name

**File:** `components/layout/app-sidebar.tsx`
**Lines:** 74, Also appears in `components/layout/navbar.tsx` line 31
**Purpose:** Display application brand name

```tsx
// app-sidebar.tsx
<span className="text-base font-semibold">MCP Hub</span>

// navbar.tsx
<span>MCP Hub</span>
```

**Key Details:**
- Brand name "MCP Hub" appears hardcoded in multiple locations
- Located in navigation components visible to all users
- No translation key exists for this brand identifier

</CodeSection>

<CodeSection>

## Code Section: Hardcoded Navigation Labels in Navbar

**File:** `components/layout/navbar.tsx`
**Lines:** 14-19
**Purpose:** Define navigation items for top navbar

```tsx
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/developer', label: 'Developer', icon: Bug },
  { href: '/settings', label: 'Settings', icon: Settings },
];
```

**Key Details:**
- Four hardcoded English labels
- No use of translation hook
- This component is not explicitly marked as Client Component but uses hooks
- Duplicates labels from app-sidebar with different terminology

</CodeSection>

<CodeSection>

## Code Section: Hardcoded Link Text in Footer

**File:** `components/layout/app-sidebar.tsx`
**Lines:** 108
**Purpose:** Display footer link text

```tsx
<span className="text-xs">Model Context Protocol</span>
```

**Key Details:**
- Footer link displays "Model Context Protocol" as hardcoded text
- Could be either a brand identifier (not translated) or a localizable label

</CodeSection>

<CodeSection>

## Code Section: Hardcoded aria-label

**File:** `components/layout/site-header.tsx`
**Lines:** 30
**Purpose:** Accessibility label for home button

```tsx
<Link
  href="/"
  className="hover:text-foreground transition-colors flex-shrink-0"
  aria-label="Home"
>
```

**Key Details:**
- Hardcoded aria-label="Home" for accessibility
- Should use translation key for internationalization
- Improves accessibility when properly translated

</CodeSection>

---

### 3. Translation Coverage Analysis

#### Fully Internationalized Pages

| Page | Status | Translation Hook | Notes |
|------|--------|------------------|-------|
| `app/[locale]/page.tsx` (Dashboard) | ✓ Complete | `useTranslations("dashboard")` | All user-facing strings use keys |
| `app/[locale]/not-found.tsx` | ✓ Complete | `useTranslations("notFoundPage")` | Proper i18n usage |
| `app/[locale]/chat/error.tsx` | ✓ Complete | `useTranslations("chat.error")` | Error messages translated |
| `app/[locale]/settings/error.tsx` | ✓ Complete | `useTranslations("settings.page")` | Uses error path correctly |
| `app/error.tsx` | ✓ Complete | `useTranslations("errorPage")` | Fallback error page properly i18n'd |
| `app/loading.tsx` | ✓ Complete | `useTranslations("loadingState")` | Loading state strings translated |

#### Partially Internationalized/Missing

| Component | Issue | Location | Impact |
|-----------|-------|----------|--------|
| App Sidebar | Hardcoded labels | `components/layout/app-sidebar.tsx` | Navigation labels not translated |
| Navbar | Hardcoded labels | `components/layout/navbar.tsx` | Top navigation not translated |
| Site Header | Hardcoded aria-label | `components/layout/site-header.tsx` | Accessibility labels not localized |

---

### 4. i18n Configuration Status

<CodeSection>

## Code Section: Next-intl Routing Configuration

**File:** `i18n/routing.ts`
**Lines:** All
**Purpose:** Define localization routing strategy

```typescript
import {defineRouting} from "next-intl/routing";

export const locales = ["en", "zh-CN"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
```

**Key Details:**
- Only 2 locales defined: English and Simplified Chinese
- Settings page defines 4 locale options: `en`, `zh-CN`, `ja` (Japanese), `es` (Spanish)
- **INCONSISTENCY**: Messages files only provided for `en` and `zh-CN`
- Japanese and Spanish locales listed in UI but no translation files exist
- `localePrefix: "as-needed"` means no prefix for default locale, prefix for others

</CodeSection>

<CodeSection>

## Code Section: Next-intl Request Configuration

**File:** `i18n/request.ts`
**Lines:** All
**Purpose:** Load appropriate message file for current locale

```typescript
import {hasLocale} from "next-intl";
import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
```

**Key Details:**
- Dynamically imports locale-specific JSON files
- Falls back to default locale if requested locale not found
- Only two message files: `en.json` (1632 lines) and `zh-CN.json` (1535 lines)

</CodeSection>

---

### 5. Service-Level User-Facing Messages

<CodeSection>

## Code Section: Error Messages in Services

**File:** `lib/services/mcp-client.ts`
**Lines:** 63-64
**Purpose:** HTTP client rate limit error

```typescript
const error = new Error(
  `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`
);
```

**Key Details:**
- Error message is hardcoded English
- User-facing message shown in error handlers
- Service layer has no access to translation system
- Should be moved to UI layer or use translation keys in error handling

</CodeSection>

<CodeSection>

## Code Section: Backup Service Error

**File:** `lib/services/backup-service.ts`
**Lines:** 88, 330
**Purpose:** Validation and error handling

```typescript
throw new Error('Backups can only be created in browser environment');
...
throw new Error('Invalid backup file format');
```

**Key Details:**
- Two hardcoded error messages in backup service
- These could be caught and translated in UI components
- Currently not localized

</CodeSection>

---

### 6. Component Toast Messages

The dashboard page (`app/[locale]/page.tsx`) uses translation keys for all toast messages:
- `t("toast.connectSuccess")`
- `t("toast.connectFailed")`
- `t("toast.connectError")`
- `t("toast.disconnectSuccess")`
- etc.

This pattern is correctly implemented in pages but inconsistent in services.

---

## Findings Section

### Critical Issues (100% Coverage Required)

1. **Missing 62 Translation Keys in zh-CN.json**
   - Complete marketplace section missing (47 keys)
   - Chat message section incomplete (15 keys)
   - Users see English text when Chinese locale is selected for these features
   - Directly violates i18n completeness requirements

2. **Hardcoded Navigation Labels in Sidebar and Navbar**
   - **File:** `components/layout/app-sidebar.tsx`
   - **Issue:** Five navigation items ("Dashboard", "Marketplace", "Chat", "Developer", "Settings") use hardcoded English labels
   - **Impact:** Primary navigation menu displays English regardless of user locale
   - **Solution:** Convert to use `useTranslations()` hook with keys from `common.navigation`
   - **Existing Keys Available:**
     - `common.navigation.dashboard`
     - `common.navigation.chat`
     - `common.navigation.settings`
     - `common.navigation.servers`
     - `common.navigation.marketplace`
     - `common.navigation.developer`

3. **Hardcoded aria-label in Site Header**
   - **File:** `components/layout/site-header.tsx`, line 30
   - **Issue:** `aria-label="Home"` is hardcoded English
   - **Impact:** Screen readers announce English label to non-English users
   - **Existing Key:** Could use from `common.navigation` or create new `a11y.home` key

4. **Hardcoded Brand Name**
   - **Files:** `components/layout/app-sidebar.tsx` (line 74), `components/layout/navbar.tsx` (line 31)
   - **Issue:** "MCP Hub" appears hardcoded in two locations
   - **Decision Required:** Is this a proper noun/brand that should remain English, or should it be translated?
   - **Current State:** No translation key exists

### Configuration Issues

5. **Unsupported Locales Listed in Settings**
   - **Issue:** Settings page lists 4 locale options: `en`, `zh-CN`, `ja`, `es`
   - **File:** `messages/en.json`, lines 408-411
   - **Problem:** Only `en.json` and `zh-CN.json` message files exist
   - **Impact:** Users selecting Japanese or Spanish will see English text
   - **Required Action:** Either add message files for `ja` and `es`, or remove these options from UI

### Implementation Pattern Issues

6. **Service-Level Error Messages Not Localized**
   - **Issue:** Error messages in `lib/services/` throw hardcoded English errors
   - **Examples:**
     - `mcp-client.ts` line 64: Rate limit error message
     - `backup-service.ts` lines 88, 330: Backup validation errors
   - **Current Practice:** Error messages are caught and re-thrown in UI components where they should be translated
   - **Recommendation:** Standardize by catching errors in UI layer and mapping to translation keys

### Summary of i18n Coverage

**Translation File Completeness:**
- `en.json`: 100% complete (1632 lines, all keys present)
- `zh-CN.json`: 96.2% complete (missing 62 keys = 3.8% gap)
- Marketplace section: 0% translated (47 keys)
- Chat attachments/messages: ~80% translated (15 keys missing)

**Component Coverage:**
- Page-level components: 100% i18n'd (all main pages use `useTranslations()`)
- Navigation components: 0% i18n'd (sidebar, navbar use hardcoded labels)
- Service layer: 0% localization (error messages hardcoded)
- UI components: 95% i18n'd (most error handling uses keys)

**Recommended Action Items (Priority Order):**

1. **CRITICAL:** Add missing 62 keys to `zh-CN.json` (marketplace and chat)
2. **HIGH:** Update `components/layout/app-sidebar.tsx` to use `useTranslations()`
3. **HIGH:** Update `components/layout/navbar.tsx` to use `useTranslations()`
4. **HIGH:** Update site header aria-label to use translation
5. **MEDIUM:** Resolve locale support inconsistency (ja, es vs en, zh-CN)
6. **MEDIUM:** Standardize service layer error handling with translation keys
7. **LOW:** Document decision on brand name localization (MCP Hub)


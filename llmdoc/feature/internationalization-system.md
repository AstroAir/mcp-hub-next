# Internationalization (i18n) System

## 1. Purpose

MCP Hub Next provides complete internationalization support for multiple languages using `next-intl`. This system enables developers to build multi-language features that automatically adapt to user locale preferences. Currently, the application supports English (en) and Simplified Chinese (zh-CN).

## 2. Architecture

### Translation File Structure

Translation files are JSON objects organized in nested key hierarchies:

**File Locations:**
- `messages/en.json` - English translations (954 keys - 100% complete)
- `messages/zh-CN.json` - Simplified Chinese translations (954 keys - 100% complete)

**Key Organization Pattern:**
```json
{
  "common": {
    "navigation": {
      "dashboard": "Dashboard",
      "chat": "Chat"
    },
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  },
  "marketplace": {
    "filters": {
      "searchPlaceholder": "Search MCP servers..."
    }
  }
}
```

### Routing & Locale Configuration

**Locale Definition (`i18n/routing.ts`):**
- Defines supported locales: `["en", "zh-CN"]`
- Sets default locale to `"en"`
- Uses `localePrefix: "as-needed"` (default locale has no prefix, others require `/zh-CN/` prefix)

**Request Configuration (`i18n/request.ts`):**
- Dynamically imports locale-specific message JSON files
- Falls back to default locale if requested locale not found
- Ensures correct messages load for each route

### Page Routing Pattern

All user-facing pages use locale prefix routing:

```
app/[locale]/page.tsx           # Dashboard at /en or /zh-CN
app/[locale]/chat/page.tsx      # Chat feature
app/[locale]/marketplace/...    # Marketplace section
app/[locale]/settings/...       # Settings section
```

## 3. Component Localization Patterns

### Using Translations in Components

**Client Components (recommended):**
```tsx
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('namespace')
  return <button>{t('action.save')}</button>
}
```

**Server Components:**
```tsx
import { getTranslations } from 'next-intl/server'

export default async function MyServerComponent() {
  const t = await getTranslations('namespace')
  return <h1>{t('title')}</h1>
}
```

### Translation Hook Best Practices

1. **Namespace Selection:** Choose the most specific namespace matching feature area:
   - `useTranslations('common.navigation')` for navigation items
   - `useTranslations('chat')` for chat features
   - `useTranslations('settings')` for settings pages

2. **Key Access:** Use dot notation for nested keys:
   - `t('dashboard')` for simple keys
   - `t('actions.save')` for nested keys
   - `t('count', { count: 5 })` for parametrized strings

3. **Fallback Handling:**
   ```tsx
   const label = t('optional.key') || 'Default Label'
   ```

## 4. Key Coverage Areas

### Navigation (100% Complete)

**Keys Located:** `common.navigation.*`
- `dashboard`, `chat`, `settings`, `developer`, `marketplace`
- Used in: `components/layout/app-sidebar.tsx`, `components/layout/navbar.tsx`

### Marketplace (100% Complete)

**Section:** `marketplace.*` (47 keys)
- **Filters:** searchPlaceholder, sort options (stars, downloads, updated, name), category, tags
- **Cards:** recommended badge, author, stats (stars, downloads), buttons (GitHub, Install, Details)
- **Details:** stats, MCP ID copy, actions, README
- **View:** title, subtitle, result count, loading state

### Chat Messages (100% Complete)

**Section:** `chat.message.*` (15+ keys)
- **Attachments:** count display, attachment icons
- **File Preview:** PDF preview button, preview tooltips
- **Tool Calls:** title, parameters, response, status (requested/success/error)
- **Images:** preview alt text

### Settings (100% Complete)

**Section:** `settings.*`
- **Locale Options:** English, Chinese (Simplified) - unsupported locales (ja, es) removed
- **Configuration:** model settings, backup/restore, API keys
- **Preferences:** theme selection, language switching

### Error Handling (100% Complete)

**Sections:** `common.errors.*`, `settings.backup.errors.*`
- **Common:** unknown error, forbidden, not found, rate limit exceeded
- **Service-Specific:** backup-only errors, invalid format errors
- Errors use error codes internally with UI translation at component layer

## 5. Relevant Code Modules

### Core i18n Configuration
- `i18n/routing.ts` - Locale definitions and routing strategy
- `i18n/request.ts` - Message file loading for each locale

### Navigation Components
- `components/layout/app-sidebar.tsx` - Main navigation sidebar with full i18n support
- `components/layout/navbar.tsx` - Top navbar with full i18n support
- `components/layout/site-header.tsx` - Site header with localized aria-labels

### Translation Files
- `messages/en.json` - Complete English translation dictionary
- `messages/zh-CN.json` - Complete Simplified Chinese translation dictionary

### Service Layer
- `lib/services/mcp-client.ts` - Uses error codes for localized error messages
- `lib/services/backup-service.ts` - Uses error codes for localized backup errors

### Settings UI
- `components/settings/locale-settings.tsx` - Language preference selector (supports en, zh-CN only)

## 6. Adding New Translatable Strings

### Step-by-Step Process

**1. Identify the feature area:**
- Marketplace feature → use `marketplace.*` namespace
- Chat feature → use `chat.*` namespace
- Common UI → use `common.*` namespace

**2. Add to both translation files:**

File: `messages/en.json`
```json
{
  "marketplace": {
    "myNewFeature": {
      "title": "My Feature Title",
      "description": "Feature description"
    }
  }
}
```

File: `messages/zh-CN.json` (add exact same keys with Chinese translations)
```json
{
  "marketplace": {
    "myNewFeature": {
      "title": "我的功能标题",
      "description": "功能描述"
    }
  }
}
```

**3. Update the component:**
```tsx
const t = useTranslations('marketplace.myNewFeature')
return (
  <div>
    <h1>{t('title')}</h1>
    <p>{t('description')}</p>
  </div>
)
```

**4. Verify key parity:**
Run: `pnpm test` to ensure all keys in en.json exist in zh-CN.json

### Parameter Substitution

For dynamic content, use ICU message format:

```json
{
  "chat": {
    "message": {
      "attachmentsCount": "{count, plural, one {# attachment} other {# attachments}}"
    }
  }
}
```

Usage:
```tsx
t('attachmentsCount', { count: 5 })  // "5 attachments"
```

## 7. Key Constraints & Patterns

### Required Rules

1. **Key Parity:** Every key in `en.json` must exist in `zh-CN.json`
   - Inconsistent keys break Chinese localization
   - CI/CD should enforce this check

2. **Supported Locales Only:** Only `en` and `zh-CN` are supported
   - Don't add unsupported locales to `messages/en.json` locale options
   - Settings UI reflects actual supported locales

3. **Navigation Labels:** All navigation text must use translation keys
   - No hardcoded English strings in sidebar/navbar components
   - Exceptions: brand name "MCP Hub" (typically stays English)

4. **Service Errors:** Error messages in `lib/services/` use error codes
   - Services throw: `new Error('ERROR_CODE')`
   - UI components catch and translate via `common.errors.*` keys
   - Allows language-agnostic service layer

### Accessibility Translation

Accessibility labels (aria-labels, alt-text) must be localized:
- Use `useTranslations('common.a11y')` for accessibility keys
- Examples: `a11y.home`, `a11y.moreOptions`, `a11y.toggleMenu`

## 8. Attention

1. **File Encoding:** Ensure both `messages/en.json` and `messages/zh-CN.json` maintain exact key structure. Misaligned keys cause undefined translation fallback.

2. **Plural Forms:** For plural-aware text, use ICU message format syntax (see Parameter Substitution above). This handles both English and Chinese plural rules.

3. **Brand Name Consistency:** "MCP Hub" appears in code as a constant brand identifier. Typically not translated; coordinate with product team before localizing.

4. **Performance:** Translation keys are loaded once per request in server components and cached in client components via `useTranslations()` hook. Avoid creating translations dynamically.

5. **Testing i18n Features:** When testing marketplace, chat, or settings features with Chinese locale, verify actual UI renders Chinese text (not undefined/fallback keys). Check browser console for missing translation warnings.

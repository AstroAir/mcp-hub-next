# Adding Translatable Strings to MCP Hub Next

## 1. Purpose

This SOP ensures that all new user-facing text added to MCP Hub Next is properly internationalized and available in both English and Simplified Chinese. Proper i18n implementation prevents Chinese users from seeing English fallback text and maintains consistent user experience across all locales.

## 2. Step-by-Step Procedure

### Phase 1: Planning (Identify Target Area)

**Step 1.1:** Determine the feature namespace
- Dashboard features → `dashboard.*`
- Chat features → `chat.*`
- Marketplace features → `marketplace.*`
- Settings features → `settings.*`
- Navigation/UI → `common.*`
- Error messages → `common.errors.*` or `{feature}.errors.*`
- Accessibility labels → `common.a11y.*`

**Step 1.2:** Review existing keys in target namespace
- Open `messages/en.json`
- Search for existing keys in your namespace (e.g., `"marketplace"` in JSON editor)
- Check if translation key already exists to avoid duplicates

### Phase 2: Translation File Updates

**Step 2.1:** Add English translation key

Location: `messages/en.json`

Structure for new marketplace feature example:
```json
{
  "marketplace": {
    "myFeature": {
      "title": "My New Feature",
      "description": "This is what the feature does",
      "button": "Take Action"
    }
  }
}
```

**Best Practices:**
- Use camelCase for all key names
- Keep English values concise and clear
- Use nested objects to organize related keys
- Add comments above complex sections using `// comment syntax` (valid in JSON with preprocessor)

**Step 2.2:** Add Chinese translation key with exact same structure

Location: `messages/zh-CN.json`

Example (Chinese translation of above):
```json
{
  "marketplace": {
    "myFeature": {
      "title": "我的新功能",
      "description": "这是该功能的作用",
      "button": "采取行动"
    }
  }
}
```

**Critical Rules:**
- **Key Structure Match:** All keys must be identical in both files (character-for-character)
- **Complete Both Files:** Never add a key to only one file
- **Character Encoding:** Both files must use UTF-8 encoding (usually default in modern editors)

**Step 2.3:** Verify key parity (before committing)

Run this check:
```bash
# Verify all keys in en.json exist in zh-CN.json
pnpm test

# Or manually use jq (if available):
# jq -S 'keys' messages/en.json > /tmp/en.keys
# jq -S 'keys' messages/zh-CN.json > /tmp/zh.keys
# diff /tmp/en.keys /tmp/zh.keys
```

Ensure no test failures related to i18n key mismatches.

### Phase 3: Component Implementation

**Step 3.1:** Import translation hook

For client components:
```tsx
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('marketplace.myFeature')
  // Rest of component...
}
```

For server components:
```tsx
import { getTranslations } from 'next-intl/server'

export default async function MyComponent() {
  const t = await getTranslations('marketplace.myFeature')
  // Rest of component...
}
```

**Step 3.2:** Replace hardcoded strings with translation keys

Before:
```tsx
<button onClick={handleClick}>Take Action</button>
<p>This is what the feature does</p>
```

After:
```tsx
<button onClick={handleClick}>{t('button')}</button>
<p>{t('description')}</p>
```

**Step 3.3:** Test in both locales

1. Start dev server: `pnpm dev`
2. Visit `/en/` route (English)
3. Verify your text appears correctly
4. Switch to `/zh-CN/` route (Chinese)
5. Verify Chinese translation appears (not English fallback)

### Phase 4: Accessibility Considerations

**Step 4.1:** Localize all user-facing labels

Aria-labels, alt-text, and tooltips must be translated:

```tsx
const t = useTranslations('common.a11y')
return (
  <button aria-label={t('moreOptions')}>
    <MoreIcon />
  </button>
)
```

**Step 4.2:** For interactive elements requiring tooltips

Add to translation files:
```json
{
  "marketplace": {
    "card": {
      "installButton": "Install",
      "installTooltip": "Click to install this server"
    }
  }
}
```

Use in component:
```tsx
<Tooltip title={t('installTooltip')}>
  <button>{t('installButton')}</button>
</Tooltip>
```

### Phase 5: Dynamic Content (Parameters)

**Step 5.1:** For strings with variable content, use ICU message format

Translation file:
```json
{
  "chat": {
    "message": {
      "attachmentsCount": "{count, plural, one {# attachment} other {# attachments}}"
    }
  }
}
```

Component:
```tsx
const t = useTranslations('chat.message')
const message = t('attachmentsCount', { count: fileCount })
// Output: "5 attachments" or "1 attachment"
```

**Step 5.2:** For simple variable substitution

Translation file:
```json
{
  "settings": {
    "backup": {
      "successMessage": "Backup created on {date}"
    }
  }
}
```

Component:
```tsx
const t = useTranslations('settings.backup')
const message = t('successMessage', { date: new Date().toLocaleDateString() })
```

## 3. Relevant Code Modules

- `messages/en.json` - English translation dictionary (1,632 keys)
- `messages/zh-CN.json` - Simplified Chinese translation dictionary (1,632 keys)
- `i18n/routing.ts` - Defines supported locales (en, zh-CN)
- `i18n/request.ts` - Loads locale-specific message files
- `components/layout/app-sidebar.tsx` - Reference implementation using `useTranslations()`
- `components/layout/navbar.tsx` - Reference implementation with navigation labels
- `components/settings/locale-settings.tsx` - Settings UI for language selection

## 4. Attention

1. **Never Ship Incomplete Translations:** Missing keys in zh-CN.json means Chinese users see English text. Always add to both files in the same commit.

2. **Namespace Consistency:** Use existing namespaces when possible. New top-level namespaces should be coordinated with the team.

3. **No Hardcoded English in Components:** All user-facing text must use translation hooks. Hardcoding "Dashboard" instead of using `t('dashboard')` defeats the entire i18n system.

4. **Test Both Locales:** Don't assume if English works, Chinese will too. Actually test the `/zh-CN/` route to verify correct translation appears.

5. **Git Commits:** Include both `messages/en.json` and `messages/zh-CN.json` changes in the same commit. Reviewers should verify key parity.

6. **File Encoding:** Keep JSON files as UTF-8 without BOM. Chinese characters must display correctly in source control.

7. **Large Plurals:** For complex plural rules, test edge cases (0, 1, 2+) in both English and Chinese to ensure ICU format works correctly.

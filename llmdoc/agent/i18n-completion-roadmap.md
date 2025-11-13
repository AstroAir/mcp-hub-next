# i18n Implementation Completion Roadmap

## Executive Summary

The MCP Hub Next application has a **96.2% translation coverage** for the existing supported locales (English and Simplified Chinese). However, there are **critical gaps** that prevent achieving 100% internationalization:

- **62 missing translation keys** in `zh-CN.json` (3.8% of total)
- **4 components** using hardcoded English labels (navigation, breadcrumbs)
- **1 locale inconsistency** (UI lists 4 locales but only 2 are supported)
- **3 service-layer errors** not localized

**Estimated completion time:** 4-6 hours for one developer

---

## Phase 1: Critical Fixes (2-3 hours)

### Phase 1.1: Add Missing Translation Keys

**Effort:** 1.5 hours
**Impact:** Unblocks marketplace and chat message features for Chinese users

#### Action 1.1.1: Marketplace Keys (47 keys)

**File to Update:** `messages/zh-CN.json`
**Reference:** `messages/en.json` lines 142-219

**Keys to Add:**
```
marketplace.filters.* (13 keys)
marketplace.card.* (10 keys)
marketplace.toasts.* (4 keys)
marketplace.detail.* (6 keys)
marketplace.view.* (12 keys)
```

**Translation Strategy:** Use existing translation patterns in the file:
- Placeholders → Search/input guidance in Chinese
- Action buttons → Verb-noun format in Chinese
- Stats → Quantitative descriptions in Chinese
- Toasts → User feedback messages in Chinese

**Example Mapping:**
| English | Chinese |
|---------|---------|
| "Search MCP servers..." | "搜索 MCP 服务器..." |
| "Most stars" | "最多星标" |
| "Install" | "安装" |
| "Installing..." | "安装中..." |

**Checklist:**
- [ ] Copy marketplace section from en.json
- [ ] Translate all filter labels
- [ ] Translate all button labels
- [ ] Translate all toast messages
- [ ] Verify plural forms for result counts
- [ ] Test in Chinese locale

---

#### Action 1.1.2: Chat Message Keys (15 keys)

**File to Update:** `messages/zh-CN.json`
**Reference:** `messages/en.json` lines 310-332

**Keys to Add:**
```
chat.message.attachmentsCount
chat.message.attachmentIcon
chat.message.previewPdf
chat.message.previewButton
chat.message.pdfPreviewTitle
chat.message.previewTooltip
chat.message.downloadTooltip
chat.message.imagePreviewAlt
chat.message.toolCall.* (4 keys)
chat.message.toolResult.* (2 keys)
chat.interface.status.streaming
```

**Translation Notes:**
- "Attachment" → "附件"
- "Preview" → "预览"
- "Tool call" → "工具调用"
- "Parameters" → "参数"
- "Response" → "响应"

**Checklist:**
- [ ] Add all 15 keys to zh-CN.json chat section
- [ ] Verify plural forms match en.json
- [ ] Test chat message display in Chinese locale

---

#### Action 1.1.3: Accessibility Keys (1 key)

**File to Update:** Both `messages/en.json` and `messages/zh-CN.json`
**Location:** Add to `common.a11y` section

**Key to Add:**
```
common.a11y.home
```

**Values:**
```json
{
  "en": "Home",
  "zh-CN": "首页"
}
```

**Checklist:**
- [ ] Add "home" key to en.json common.a11y section
- [ ] Add "home" key to zh-CN.json common.a11y section
- [ ] Update site-header.tsx to use this key

---

### Phase 1.2: Fix Navigation Component Hardcoding

**Effort:** 1.5 hours
**Impact:** Make primary navigation translatable

#### Action 1.2.1: Update App Sidebar

**File:** `components/layout/app-sidebar.tsx`

**Changes Required:**
1. Verify `'use client'` directive exists (line 1)
2. Add import: `import { useTranslations } from 'next-intl';`
3. In component, add: `const t = useTranslations('common.navigation');`
4. Update navItems array to use translation functions

**Current (Lines 24-50):**
```typescript
const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Developer", url: "/developer", icon: Bug },
  { title: "Settings", url: "/settings", icon: Settings },
]
```

**Updated:**
```typescript
const navItems = [
  { title: t('dashboard'), url: "/", icon: Home },
  { title: t('marketplace'), url: "/marketplace", icon: Store },
  { title: t('chat'), url: "/chat", icon: MessageSquare },
  { title: t('developer'), url: "/developer", icon: Bug },
  { title: t('settings'), url: "/settings", icon: Settings },
]
```

**Issues to Watch:**
- Component needs to be Client Component (already is)
- Hook must be called at component level, before rendering
- navItems array references `t()` from hook

**Testing:**
- [ ] Verify sidebar renders correctly in English
- [ ] Verify sidebar renders in Chinese
- [ ] Check all 5 labels appear translated
- [ ] Test sidebar collapse/expand functionality

---

#### Action 1.2.2: Update Navbar Component

**File:** `components/layout/navbar.tsx`

**Changes Required:**
1. Verify `'use client'` directive exists
2. Add import: `import { useTranslations } from 'next-intl';`
3. In component, add: `const t = useTranslations('common.navigation');`
4. Update navItems array to use translation functions

**Current (Lines 14-19):**
```typescript
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/developer', label: 'Developer', icon: Bug },
  { href: '/settings', label: 'Settings', icon: Settings },
];
```

**Updated:**
```typescript
const navItems = [
  { href: '/', label: t('dashboard'), icon: Home },
  { href: '/chat', label: t('chat'), icon: MessageSquare },
  { href: '/developer', label: t('developer'), icon: Bug },
  { href: '/settings', label: t('settings'), icon: Settings },
];
```

**Testing:**
- [ ] Navbar appears correctly in English
- [ ] Navbar appears correctly in Chinese
- [ ] All 4 labels are localized
- [ ] Navigation still functions correctly

---

#### Action 1.2.3: Update Site Header aria-label

**File:** `components/layout/site-header.tsx`

**Changes Required:**
1. Add `'use client'` directive if missing
2. Add import: `import { useTranslations } from 'next-intl';`
3. In component, add: `const t = useTranslations('common.a11y');`
4. Update aria-label on home link

**Current (Line 30):**
```typescript
<Link
  href="/"
  className="hover:text-foreground transition-colors flex-shrink-0"
  aria-label="Home"
>
```

**Updated:**
```typescript
<Link
  href="/"
  className="hover:text-foreground transition-colors flex-shrink-0"
  aria-label={t('home') || 'Home'}
>
```

**Fallback:** Include `|| 'Home'` for safety in case key is missing

**Testing:**
- [ ] Verify aria-label reads correctly in English
- [ ] Verify aria-label reads correctly in Chinese (use screen reader)
- [ ] Home link still navigates correctly

---

## Phase 2: Configuration & Consistency (0.5-1 hour)

### Phase 2.1: Resolve Locale Support Inconsistency

**Effort:** 0.5 hours
**Impact:** Prevents user confusion about locale support

#### Issue Description

Settings UI lists 4 locale options:
- English ✓ (supported)
- Chinese (Simplified) ✓ (supported)
- Japanese ✗ (NOT supported - no translation file)
- Spanish ✗ (NOT supported - no translation file)

Routing configuration only defines 2 locales:
```typescript
// i18n/routing.ts
export const locales = ["en", "zh-CN"] as const;
```

#### Recommended Solution: Remove Unsupported Locales

**Action 2.1.1: Update en.json**

**File:** `messages/en.json`
**Current (Lines 408-411):**
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

**Updated:**
```json
"locale": {
  "options": {
    "en": "English",
    "zh-CN": "Chinese (Simplified)"
  }
}
```

**Action 2.1.2: Update zh-CN.json**

**File:** `messages/zh-CN.json`
**Current (Lines 308-316):**
```json
"locale": {
  "options": {
    "en": "英语",
    "zh-CN": "简体中文",
    "ja": "日语",
    "es": "西班牙语"
  }
}
```

**Updated:**
```json
"locale": {
  "options": {
    "en": "英语",
    "zh-CN": "简体中文"
  }
}
```

**Testing:**
- [ ] Settings page shows only 2 locale options
- [ ] No errors in console
- [ ] Locale switching still works

---

## Phase 3: Service Layer (0.5-1 hour)

### Phase 3.1: Refactor Error Messages

**Effort:** 0.5-1 hours
**Impact:** Enables proper error message localization

#### Action 3.1.1: MCP Client Service

**File:** `lib/services/mcp-client.ts`
**Current (Lines 63-65):**
```typescript
const error = new Error(
  `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`
);
```

**Updated:**
```typescript
const error = new Error('RATE_LIMIT_EXCEEDED');
(error as any).code = 'RATE_LIMIT_EXCEEDED';
(error as any).retryAfter = result.retryAfter;
```

**Add to Translation Files:**

`messages/en.json`:
```json
{
  "common": {
    "errors": {
      "rateLimitExceeded": "Rate limit exceeded. Retry after {seconds} seconds."
    }
  }
}
```

`messages/zh-CN.json`:
```json
{
  "common": {
    "errors": {
      "rateLimitExceeded": "超过速率限制。{seconds}秒后重试。"
    }
  }
}
```

**UI Handler (example from dashboard):**
```typescript
catch (error: any) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error(t('common.errors.rateLimitExceeded', {
      seconds: error.retryAfter
    }));
  } else {
    toast.error(t('toast.connectError'));
  }
}
```

---

#### Action 3.1.2: Backup Service

**File:** `lib/services/backup-service.ts`
**Current (Lines 88, 330):**
```typescript
// Line 88
throw new Error('Backups can only be created in browser environment');

// Line 330
throw new Error('Invalid backup file format');
```

**Updated:**
```typescript
// Line 88
throw new Error('BACKUP_BROWSER_ONLY');
(error as any).code = 'BACKUP_BROWSER_ONLY';

// Line 330
throw new Error('BACKUP_INVALID_FORMAT');
(error as any).code = 'BACKUP_INVALID_FORMAT';
```

**Add to Translation Files:**

`messages/en.json`:
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

`messages/zh-CN.json`:
```json
{
  "settings": {
    "backup": {
      "errors": {
        "browserOnly": "只能在浏览器环境中创建备份",
        "invalidFormat": "无效的备份文件格式"
      }
    }
  }
}
```

---

## Phase 4: Testing & Verification (1 hour)

### Phase 4.1: Manual Testing Checklist

#### Navigation & UI
- [ ] Sidebar displays all 5 nav items in English
- [ ] Sidebar displays all 5 nav items in Chinese
- [ ] Navbar displays all 4 nav items in English
- [ ] Navbar displays all 4 nav items in Chinese
- [ ] Breadcrumbs home link has correct aria-label in English
- [ ] Breadcrumbs home link has correct aria-label in Chinese

#### Marketplace Feature
- [ ] Marketplace page loads without errors in English
- [ ] Marketplace page loads without errors in Chinese
- [ ] Filter labels display in Chinese
- [ ] Card labels display in Chinese
- [ ] Toast messages display in Chinese
- [ ] No console errors or warnings

#### Chat Feature
- [ ] Chat messages display without errors in English
- [ ] Chat messages display without errors in Chinese
- [ ] Tool call messages display correctly in Chinese
- [ ] Attachment labels display in Chinese
- [ ] File preview buttons display in Chinese

#### Settings
- [ ] Locale selector shows only 2 options (en, zh-CN)
- [ ] Switching locales works correctly
- [ ] All settings pages render without i18n errors

#### Error Handling
- [ ] Rate limit errors display translated message
- [ ] Backup errors display translated message
- [ ] Fallback messages work if key is missing

#### Accessibility
- [ ] Screen reader reads nav items in correct language
- [ ] aria-labels are properly localized
- [ ] All interactive elements have proper labels

---

### Phase 4.2: Automated Testing

**Tests to Create/Update:**

1. **Translation Key Coverage Test**
   ```typescript
   // Test that all en.json keys exist in zh-CN.json
   const en = require('../messages/en.json');
   const zhCN = require('../messages/zh-CN.json');

   function checkKeys(en, zhCN, path = ''): string[] {
     const missing = [];
     // ... implementation ...
     return missing;
   }

   expect(checkKeys(en, zhCN)).toEqual([]);
   ```

2. **Component i18n Test**
   ```typescript
   // Test that navigation components use useTranslations()
   import { AppSidebar } from '@/components/layout/app-sidebar';

   test('sidebar renders localized navigation items', () => {
     const { container } = render(
       <IntlProvider locale="zh-CN" messages={zhCNMessages}>
         <AppSidebar />
       </IntlProvider>
     );

     expect(container).toHaveTextContent('总览'); // Chinese for Dashboard
     expect(container).toHaveTextContent('对话'); // Chinese for Chat
   });
   ```

3. **Locale Configuration Test**
   ```typescript
   // Test routing configuration matches supported locales
   import { routing } from '@/i18n/routing';

   test('supported locales match message files', () => {
     const supportedLocales = routing.locales;
     expect(supportedLocales).toEqual(['en', 'zh-CN']);
   });
   ```

---

## Phase 5: Documentation & Future

### Phase 5.1: Update i18n Documentation

**Files to Update/Create:**
1. Add i18n guidelines to project README
2. Create `docs/i18n-guidelines.md`:
   - How to add new translatable strings
   - Translation workflow
   - Testing localized features
   - Common i18n patterns in codebase

**Content to Include:**
```markdown
# i18n Guidelines

## Adding New Strings

1. Always use `useTranslations()` hook in Client Components
2. Add keys to `messages/en.json`
3. Add matching keys to `messages/zh-CN.json`
4. Test in both locales before committing

## Common Patterns

### Page-level translations
\`\`\`typescript
const t = useTranslations('pageName');
\`\`\`

### Common/global strings
\`\`\`typescript
const t = useTranslations('common');
\`\`\`

### Component-level translations
\`\`\`typescript
const t = useTranslations('components.componentName');
\`\`\`

## Service Layer Errors
- Use error codes instead of messages
- Translate in UI layer where toast/alert is shown
```

---

### Phase 5.2: Future Locale Support

**If adding Japanese or Spanish support:**

1. Create `messages/ja.json` and `messages/es.json`
2. Update `i18n/routing.ts`:
   ```typescript
   export const locales = ["en", "zh-CN", "ja", "es"] as const;
   ```
3. Add to locale options in `messages/en.json`, etc.
4. Translate all ~1630 keys to new languages
5. Test all features in new locales

---

## Success Criteria

### 100% i18n Coverage Definition

✓ All user-facing text strings use translation keys
✓ All navigation labels translated
✓ All error messages translated
✓ All tooltips and aria-labels translated
✓ All marketplace features translated
✓ All chat features translated
✓ No hardcoded English in components
✓ No hardcoded English in services
✓ All translation keys in en.json have matching keys in zh-CN.json
✓ Locale configuration consistent with supported languages

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Missing translation keys cause untranslated UI | User confusion | High | Complete Phase 1 keys first |
| Navigation changes break existing routing | Site unusable | Medium | Test navigation after changes |
| Inconsistent translation terminology | Poor user experience | Medium | Review translations against existing patterns |
| Service error handling breaks | Runtime errors | Low | Test all error paths |
| Locale persistence not working | Users reset locale preference | Low | Test locale persistence |

---

## Rollout Plan

**Timeline:** 1 development day

**1. Morning (2-3 hours):** Phase 1 - Critical fixes
- Add missing translation keys
- Update navigation components
- Update accessibility labels

**2. Afternoon (1-2 hours):** Phase 2-3 - Configuration & Services
- Resolve locale inconsistency
- Refactor service error messages
- Add translation keys for errors

**3. Late Afternoon (1 hour):** Phase 4 - Testing
- Manual testing in both locales
- Update automated tests
- Fix any issues found

**4. Deployment:** Create PR with all changes, review, merge

---

## Resource Requirements

| Phase | Developer Hours | Tester Hours | Total |
|-------|-----------------|--------------|-------|
| 1: Critical Fixes | 2-3 | 0.5 | 2.5-3.5 |
| 2: Configuration | 0.5 | 0.25 | 0.75 |
| 3: Service Layer | 0.5 | 0.25 | 0.75 |
| 4: Testing | 0.5 | 1 | 1.5 |
| 5: Documentation | 0.5 | 0 | 0.5 |
| **Total** | **4-5** | **2** | **6-7** |

---

## Related Documentation

- [i18n Implementation Audit](./i18n-implementation-audit.md) - Detailed findings
- [i18n Hardcoded Strings Inventory](./i18n-hardcoded-strings-inventory.md) - Specific code examples
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- Project CLAUDE.md - Architecture overview


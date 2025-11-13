# i18n Code Locations Reference

## Quick Location Index

This document provides exact file paths, line numbers, and code snippets for all i18n issues identified in the audit.

---

## 1. CRITICAL: Missing Translation Keys

### Location: `messages/zh-CN.json`

**Issue:** 62 translation keys present in `en.json` but missing in `zh-CN.json`

#### Marketplace Section (should start around line 147 in zh-CN.json)

**Reference File:** `messages/en.json` lines 142-219

| Key | Status | Required |
|-----|--------|----------|
| marketplace.* (47 keys) | MISSING | Add entire section |
| marketplace.filters.searchPlaceholder | Missing | "搜索 MCP 服务器..." |
| marketplace.filters.sort.placeholder | Missing | "排序按" |
| marketplace.filters.sort.options.stars | Missing | "最多星标" |
| marketplace.filters.sort.options.downloads | Missing | "最多下载" |
| marketplace.filters.sort.options.updated | Missing | "最近更新" |
| marketplace.filters.sort.options.name | Missing | "名称 A–Z" |
| marketplace.filters.category.placeholder | Missing | "分类" |
| marketplace.filters.category.all | Missing | "所有分类" |
| marketplace.filters.tags.button | Missing | "标签" |
| marketplace.filters.tags.dropdownLabel | Missing | "选择标签" |
| marketplace.filters.quickFilters.recommended | Missing | "推荐" |
| marketplace.filters.quickFilters.noApiKey | Missing | "无 API 密钥" |
| marketplace.filters.reset | Missing | "重置筛选" |
| marketplace.card.* | Missing | 10 keys |
| marketplace.toasts.* | Missing | 4 keys |
| marketplace.detail.* | Missing | 6 keys |
| marketplace.view.* | Missing | 12 keys |

#### Chat Message Section (should be around line 237 in zh-CN.json)

**Reference File:** `messages/en.json` lines 302-333

| Key | Status | Required |
|-----|--------|----------|
| chat.message.attachmentsCount | Missing | "{count, plural, one {# 个附件} other {# 个附件}}" |
| chat.message.attachmentIcon | Missing | "附件图标" |
| chat.message.previewPdf | Missing | "预览 PDF" |
| chat.message.previewButton | Missing | "预览" |
| chat.message.previewTooltip | Missing | "预览 {name}" |
| chat.message.downloadTooltip | Missing | "下载 {name}" |
| chat.message.imagePreviewAlt | Missing | "图像预览" |
| chat.message.pdfPreviewTitle | Missing | "PDF 预览" |
| chat.message.toolCall.title | Missing | "工具调用：{name}" |
| chat.message.toolCall.parameters | Missing | "参数" |
| chat.message.toolCall.response | Missing | "响应" |
| chat.message.toolCall.unknownError | Missing | "未知错误" |
| chat.message.toolCall.status.requested | Missing | "已请求" |
| chat.message.toolCall.status.success | Missing | "成功" |
| chat.message.toolCall.status.error | Missing | "错误" |
| chat.message.toolResult.title | Missing | "工具：{name}" |
| chat.message.toolResult.error | Missing | "错误：{message}" |

#### Interface Status (around line 267-268 in zh-CN.json)

**Reference File:** `messages/en.json` line 363

| Key | Status | Required |
|-----|--------|----------|
| chat.interface.status.streaming | Missing | "流式传输中..." |

#### Accessibility (around line 44 in zh-CN.json)

**Reference File:** `messages/en.json` line 44

| Key | Status | Required |
|-----|--------|----------|
| common.a11y.home | Missing | "首页" |

---

## 2. CRITICAL: Hardcoded Navigation Labels

### Location 1: `components/layout/app-sidebar.tsx`

**File Path:** `/d:\Project\mcp-hub-next\components\layout\app-sidebar.tsx`

#### Code Section 1: Navigation Array (Lines 24-50)

```typescript
// Lines 24-50: HARDCODED NAVIGATION LABELS
const navItems = [
  {
    title: "Dashboard",        // Line 26 - HARDCODED
    url: "/",
    icon: Home,
  },
  {
    title: "Marketplace",      // Line 31 - HARDCODED
    url: "/marketplace",
    icon: Store,
  },
  {
    title: "Chat",             // Line 36 - HARDCODED
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Developer",        // Line 41 - HARDCODED
    url: "/developer",
    icon: Bug,
  },
  {
    title: "Settings",         // Line 46 - HARDCODED
    url: "/settings",
    icon: Settings,
  },
]
```

**Fix Required:**
- Line 2: Add `import { useTranslations } from 'next-intl';`
- Inside component (before navItems): Add `const t = useTranslations('common.navigation');`
- Line 26: Replace `"Dashboard"` with `t('dashboard')`
- Line 31: Replace `"Marketplace"` with `t('marketplace')`
- Line 36: Replace `"Chat"` with `t('chat')`
- Line 41: Replace `"Developer"` with `t('developer')`
- Line 46: Replace `"Settings"` with `t('settings')`

**Current Translation Keys Available:**
- `common.navigation.dashboard` (en.json line 11, zh-CN.json line 11)
- `common.navigation.marketplace` (en.json line 15, zh-CN.json line 15)
- `common.navigation.chat` (en.json line 12, zh-CN.json line 12)
- `common.navigation.developer` (en.json line 16, zh-CN.json line 16)
- `common.navigation.settings` (en.json line 13, zh-CN.json line 13)

#### Code Section 2: Brand Name (Line 74)

```typescript
// Line 74: HARDCODED BRAND NAME
<span className="text-base font-semibold">MCP Hub</span>
```

**Note:** Brand names typically remain in English. No fix needed unless policy changes.

---

### Location 2: `components/layout/navbar.tsx`

**File Path:** `/d:\Project\mcp-hub-next\components\layout\navbar.tsx`

#### Code Section: Navigation Array (Lines 14-19)

```typescript
// Lines 14-19: HARDCODED NAVIGATION LABELS
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },         // Line 15 - HARDCODED
  { href: '/chat', label: 'Chat', icon: MessageSquare }, // Line 16 - HARDCODED
  { href: '/developer', label: 'Developer', icon: Bug },  // Line 17 - HARDCODED
  { href: '/settings', label: 'Settings', icon: Settings }, // Line 18 - HARDCODED
];
```

**Fix Required:**
- Line 1: Verify `'use client';` directive exists (line 1)
- Line 8: Add `import { useTranslations } from 'next-intl';`
- Inside component: Add `const t = useTranslations('common.navigation');`
- Line 15: Replace `'Dashboard'` with `t('dashboard')`
- Line 16: Replace `'Chat'` with `t('chat')`
- Line 17: Replace `'Developer'` with `t('developer')`
- Line 18: Replace `'Settings'` with `t('settings')`

#### Code Section: Brand Name (Line 31)

```typescript
// Line 31: HARDCODED BRAND NAME
<span>MCP Hub</span>
```

**Note:** Same as sidebar - typically remains English.

---

### Location 3: `components/layout/site-header.tsx`

**File Path:** `/d:\Project\mcp-hub-next\components\layout\site-header.tsx`

#### Code Section: Breadcrumb Home Link (Lines 27-33)

```typescript
// Lines 27-33: HARDCODED ARIA-LABEL
<Link
  href="/"
  className="hover:text-foreground transition-colors flex-shrink-0"
  aria-label="Home"  // Line 30 - HARDCODED
>
  <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
</Link>
```

**Fix Required:**
- Line 1: Add `'use client';` if missing
- Line 3: Add `import { useTranslations } from 'next-intl';`
- Inside component (after useBreadcrumbs): Add `const t = useTranslations('common.a11y');`
- Line 30: Replace `aria-label="Home"` with `aria-label={t('home') || 'Home'}`

**Translation Key Required:**
- Add `common.a11y.home` to both `en.json` and `zh-CN.json`
- English value: "Home"
- Chinese value: "首页"

---

## 3. HIGH: Unsupported Locale Configuration

### Location 1: `messages/en.json`

**File Path:** `/d:\Project\mcp-hub-next\messages\en.json`

#### Code Section: Locale Options (Lines 408-411)

```json
// Lines 408-411: LOCALE OPTIONS
"locale": {
  "options": {
    "en": "English",
    "zh-CN": "Chinese (Simplified)",
    "ja": "Japanese",              // Line 410 - NOT SUPPORTED
    "es": "Spanish"                // Line 411 - NOT SUPPORTED
  }
}
```

**Fix Required:**
- Line 410: Delete entire `"ja": "Japanese",` line
- Line 411: Delete entire `"es": "Spanish"` line

**Result:**
```json
"locale": {
  "options": {
    "en": "English",
    "zh-CN": "Chinese (Simplified)"
  }
}
```

---

### Location 2: `messages/zh-CN.json`

**File Path:** `/d:\Project\mcp-hub-next\messages\zh-CN.json`

#### Code Section: Locale Options (Lines 308-316)

```json
// Lines 308-316: LOCALE OPTIONS
"locale": {
  "options": {
    "en": "英语",
    "zh-CN": "简体中文",
    "ja": "日语",                  // Line 314 - NOT SUPPORTED
    "es": "西班牙语"               // Line 315 - NOT SUPPORTED
  }
}
```

**Fix Required:**
- Line 314: Delete entire `"ja": "日语",` line
- Line 315: Delete entire `"es": "西班牙语"` line

**Result:**
```json
"locale": {
  "options": {
    "en": "英语",
    "zh-CN": "简体中文"
  }
}
```

---

### Location 3: `i18n/routing.ts` (Reference)

**File Path:** `/d:\Project\mcp-hub-next\i18n\routing.ts`

#### Code Section: Locale Definition (Line 3)

```typescript
// Line 3: CORRECT - matches message files
export const locales = ["en", "zh-CN"] as const;
```

**Status:** ✓ This is correct. UI should match this configuration.

---

## 4. MEDIUM: Service Layer Error Messages

### Location 1: `lib/services/mcp-client.ts`

**File Path:** `/d:\Project\mcp-hub-next\lib\services\mcp-client.ts`

#### Code Section: Rate Limit Error (Lines 63-65)

```typescript
// Lines 55-71: HTTP TRANSPORT SEND METHOD
async send(message: unknown): Promise<void> {
  try {
    // Check rate limit if configured
    if (this.rateLimitOptions) {
      const limiter = getRateLimiter(this.serverId, this.rateLimitOptions);
      const result = await limiter.checkLimit(this.serverId);

      if (!result.allowed) {
        const error = new Error(
          `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`  // Lines 63-64 - HARDCODED
        );
        if (this.onerror) {
          this.onerror(error);
        }
        throw error;
      }
    }
    // ... rest of method
```

**Fix Required:**
- Lines 63-64: Replace error message with error code
- Change to:
  ```typescript
  const error = new Error('RATE_LIMIT_EXCEEDED');
  (error as any).code = 'RATE_LIMIT_EXCEEDED';
  (error as any).retryAfter = result.retryAfter;
  ```

**Translation Key Required (both en.json and zh-CN.json):**
```json
{
  "common": {
    "errors": {
      "rateLimitExceeded": "Rate limit exceeded. Retry after {seconds} seconds."
    }
  }
}
```

**Chinese Translation:**
```json
{
  "common": {
    "errors": {
      "rateLimitExceeded": "超过速率限制。{seconds}秒后重试。"
    }
  }
}
```

---

### Location 2: `lib/services/backup-service.ts`

**File Path:** `/d:\Project\mcp-hub-next\lib\services\backup-service.ts`

#### Code Section 1: Browser Environment Check (Line 88)

```typescript
// Line 88: BROWSER ENVIRONMENT ERROR
throw new Error('Backups can only be created in browser environment');
```

**Fix Required:**
- Line 88: Replace with error code:
  ```typescript
  throw new Error('BACKUP_BROWSER_ONLY');
  ```

#### Code Section 2: Invalid Format Check (Line 330)

```typescript
// Line 330: INVALID FORMAT ERROR
throw new Error('Invalid backup file format');
```

**Fix Required:**
- Line 330: Replace with error code:
  ```typescript
  throw new Error('BACKUP_INVALID_FORMAT');
  ```

**Translation Keys Required (both en.json and zh-CN.json):**
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

**Chinese Translations:**
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

## 5. Summary: All Hardcoded Strings by Location

### Files with Hardcoded English Strings

| File | Line(s) | String | Type |
|------|---------|--------|------|
| app-sidebar.tsx | 26, 31, 36, 41, 46 | Nav labels | Navigation |
| app-sidebar.tsx | 74 | "MCP Hub" | Brand name |
| navbar.tsx | 15, 16, 17, 18 | Nav labels | Navigation |
| navbar.tsx | 31 | "MCP Hub" | Brand name |
| site-header.tsx | 30 | aria-label="Home" | Accessibility |
| mcp-client.ts | 63-64 | Rate limit error | Error message |
| backup-service.ts | 88 | Browser only error | Error message |
| backup-service.ts | 330 | Invalid format error | Error message |

### Files with Missing Translation Keys

| File | Missing Keys | Count | Type |
|------|--------------|-------|------|
| zh-CN.json | marketplace.* | 47 | Feature section |
| zh-CN.json | chat.message.* | 15 | Feature section |
| en.json, zh-CN.json | common.a11y.home | 1 | Accessibility |

---

## 6. Test Verification Points

### After Navigation Component Fixes

```typescript
// Test app-sidebar.tsx
// - Verify t('dashboard') renders as "Dashboard" in English
// - Verify t('marketplace') renders as "应用商店" in Chinese
// - Verify t('chat') renders as "对话" in Chinese
// - Verify t('developer') renders as "开发者" in Chinese
// - Verify t('settings') renders as "设置" in Chinese

// Test navbar.tsx
// - Same verification as sidebar for 4 items
```

### After Translation Key Additions

```typescript
// Test marketplace features
// - All filter labels display in Chinese
// - All card labels display in Chinese
// - All toast messages display in Chinese

// Test chat features
// - Attachment count displays in Chinese
// - Tool call messages display in Chinese
// - File preview buttons display in Chinese
```

### After Service Error Refactoring

```typescript
// Test error handling
// - Rate limit error shows translated message
// - Backup errors show translated messages
// - Error codes properly captured
```

---

## 7. Configuration Files Checklist

### Files That Are Correct (No Changes Needed)

| File | Status | Reason |
|------|--------|--------|
| i18n/routing.ts | ✓ Correct | Correctly defines 2 locales |
| i18n/request.ts | ✓ Correct | Properly loads locale messages |
| messages/en.json | ✓ Correct | All keys present (after removing ja/es) |

### Files That Need Changes

| File | Status | Changes |
|------|--------|---------|
| messages/zh-CN.json | ⚠ Incomplete | Add 62 keys + remove ja/es options |
| messages/en.json | ⚠ Needs update | Remove ja/es options |

---

## 8. Priority Implementation Order

1. **First:** Update zh-CN.json with missing keys (1.5 hours)
   - Add marketplace section (47 keys)
   - Add chat message keys (15 keys)
   - Add accessibility key (1 key)

2. **Second:** Update navigation components (1 hour)
   - app-sidebar.tsx
   - navbar.tsx
   - site-header.tsx

3. **Third:** Resolve locale config (30 minutes)
   - Remove ja/es from en.json
   - Remove ja/es from zh-CN.json

4. **Fourth:** Refactor service errors (1 hour)
   - mcp-client.ts
   - backup-service.ts
   - Add error message translation keys

---

**Reference Complete** ✓

All file locations, line numbers, and code sections have been documented for precise implementation.


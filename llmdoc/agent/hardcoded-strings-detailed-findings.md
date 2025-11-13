# Hardcoded Strings - Detailed Findings by Component

## Overview

This document provides a detailed, line-by-line breakdown of every hardcoded string found during the audit, organized by component and feature area.

---

## Chat Components

### FileUpload Component

**File:** `components/chat/file-upload.tsx`
**Severity:** CRITICAL
**Total Issues:** 8

#### Issue 1: File Upload - Maximum Files Validation

**Line:** 85
**Type:** Toast notification error message
**Current Code:**
```tsx
toast.error(`Maximum ${config.maxFiles} files allowed`);
```

**Issue:**
Hardcoded error message with dynamic file count injection. Message is user-facing notification that requires translation.

**Suggested Key Path:** `chat.fileUpload.errors.maxFilesExceeded`
**Suggested Translation:** `"Maximum {count} files allowed"`
**Component Location:** Line 84-86

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
toast.error(t('errors.maxFilesExceeded', { count: config.maxFiles }));
```

---

#### Issue 2: File Upload - Invalid File Validation

**Line:** 96
**Type:** Toast notification error message (fallback)
**Current Code:**
```tsx
toast.error(validation.error || 'Invalid file');
```

**Issue:**
Hardcoded fallback error message displayed when file validation fails. Used when no specific error message is provided.

**Suggested Key Path:** `chat.fileUpload.errors.invalidFile`
**Suggested Translation:** `"Invalid file"`
**Component Location:** Line 95-97

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
toast.error(validation.error || t('errors.invalidFile'));
```

---

#### Issue 3: File Upload - Processing Error

**Line:** 105
**Type:** Toast notification error message
**Current Code:**
```tsx
toast.error(`Failed to process ${file.name}`);
```

**Issue:**
Hardcoded error message when file processing fails. Contains dynamic file name that needs to be injected into i18n message.

**Suggested Key Path:** `chat.fileUpload.errors.processingFailed`
**Suggested Translation:** `"Failed to process {filename}"`
**Component Location:** Line 104-106

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
toast.error(t('errors.processingFailed', { filename: file.name }));
```

---

#### Issue 4: File Upload - Success Message with Dynamic Count

**Line:** 111
**Type:** Toast notification success message with plural support
**Current Code:**
```tsx
toast.success(`Added ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}`);
```

**Issue:**
Hardcoded success message with manual plural handling. Should use ICU message format for proper internationalization of plurals (different languages have different plural rules).

**Suggested Key Path:** `chat.fileUpload.success.filesAdded`
**Suggested Translation (ICU Format):** `"{count, plural, one {Added # file} other {Added # files}}"`
**Component Location:** Line 109-112

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
toast.success(t('success.filesAdded', { count: newAttachments.length }));
```

**Translation Files Update:**
```json
// messages/en.json
{
  "chat": {
    "fileUpload": {
      "success": {
        "filesAdded": "{count, plural, one {Added # file} other {Added # files}}"
      }
    }
  }
}

// messages/zh-CN.json
{
  "chat": {
    "fileUpload": {
      "success": {
        "filesAdded": "已添加 {count} 个文件"
      }
    }
  }
}
```

---

#### Issue 5: File Upload - Aria Label (Accessibility)

**Line:** 144
**Type:** Accessibility label (aria-label attribute)
**Current Code:**
```tsx
<input
  // ...
  aria-label="Attach files"
/>
```

**Issue:**
Hardcoded aria-label for file input element. This is accessibility-critical text that must be localized for non-English users.

**Suggested Key Path:** `chat.fileUpload.accessibility.attachButton`
**Suggested Translation:** `"Attach files"`
**Component Location:** Line 136-145

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
<input
  // ...
  aria-label={t('accessibility.attachButton')}
/>
```

---

#### Issue 6: File Upload - Tooltip Text (Normal State)

**Line:** 164-165
**Type:** Tooltip content when file limit not reached
**Current Code:**
```tsx
<TooltipContent>
  {attachments.length >= config.maxFiles
    ? `Maximum ${config.maxFiles} files reached`
    : 'Attach files'}
</TooltipContent>
```

**Issue:**
Two hardcoded strings in tooltip: one for normal state and one for max files reached state. Both require translation.

**Suggested Key Paths:**
- `chat.fileUpload.accessibility.attachTooltip` (normal state)
- `chat.fileUpload.accessibility.maxFilesReached` (limit reached state)

**Suggested Translations:**
- `"Attach files"`
- `"Maximum {count} files reached"`

**Component Location:** Line 162-167

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
<TooltipContent>
  {attachments.length >= config.maxFiles
    ? t('accessibility.maxFilesReached', { count: config.maxFiles })
    : t('accessibility.attachTooltip')}
</TooltipContent>
```

---

#### Issue 7: File Upload - Image Preview Alt Text

**Line:** 251
**Type:** Accessibility alt text (alternative text for images)
**Current Code:**
```tsx
<ImagePreviewDialog
  open={!!previewSrc}
  src={previewSrc}
  alt="attachment preview"
  onOpenChange={(o) => !o && setPreviewSrc(null)}
/>
```

**Issue:**
Hardcoded alt text for image preview dialog. Important for accessibility and should be localized.

**Suggested Key Path:** `chat.fileUpload.accessibility.attachmentPreviewAlt`
**Suggested Translation:** `"Attachment preview"`
**Component Location:** Line 247-254

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
<ImagePreviewDialog
  open={!!previewSrc}
  src={previewSrc}
  alt={t('accessibility.attachmentPreviewAlt')}
  onOpenChange={(o) => !o && setPreviewSrc(null)}
/>
```

---

#### Issue 8: File Upload - PDF Preview Title

**Line:** 261
**Type:** Accessibility title text for PDF preview
**Current Code:**
```tsx
<PdfPreviewDialog
  open={!!pdfPreviewSrc}
  src={pdfPreviewSrc}
  title="PDF attachment preview"
  onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
/>
```

**Issue:**
Hardcoded title for PDF preview dialog. Should be localized for non-English users.

**Suggested Key Path:** `chat.fileUpload.accessibility.pdfPreviewTitle`
**Suggested Translation:** `"PDF attachment preview"`
**Component Location:** Line 257-263

**Implementation:**
```tsx
const t = useTranslations('chat.fileUpload');
<PdfPreviewDialog
  open={!!pdfPreviewSrc}
  src={pdfPreviewSrc}
  title={t('accessibility.pdfPreviewTitle')}
  onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
/>
```

---

## Settings Components

### KeyboardShortcutsEditor Component

**File:** `components/settings/keyboard-shortcuts-editor.tsx`
**Severity:** CRITICAL
**Total Issues:** 10

#### Issues 1-10: Keyboard Shortcuts Label Array

**Lines:** 16-27
**Type:** User-facing UI text (constants array with static labels)
**Current Code:**
```tsx
const LABELS: Record<ShortcutAction, string> = {
  'open-search': 'Open command palette',
  'open-settings': 'Open settings',
  'new': 'New (contextual)',
  'save': 'Save (contextual)',
  'navigate-dashboard': 'Navigate: Dashboard',
  'navigate-chat': 'Navigate: Chat',
  'navigate-settings': 'Navigate: Settings',
  'help': 'Show shortcuts help',
  'tab-next': 'Next tab/window',
  'tab-prev': 'Previous tab/window',
};
```

**Issues:**
All 10 labels are hardcoded user-facing text displayed in the keyboard shortcuts editor list. These strings are essential UI text that must be translated.

**Usage Location:** Line 106 in `items.map()` function
```tsx
return (
  it.label.toLowerCase().includes(filter.toLowerCase()) ||  // Line 106
  it.binding.toLowerCase().includes(filter.toLowerCase())
);
```

**Suggested Solution:** Replace constant with i18n lookups

**Implementation Strategy:**
Instead of a constants object, use i18n with dynamic key lookup:

```tsx
export function KeyboardShortcutsEditor() {
  const t = useTranslations('settings.keyboardShortcuts.labels');

  const items = useMemo(() => {
    return (Object.keys(shortcuts) as ShortcutAction[])
      .map((id) => ({
        id,
        label: t(id),  // Dynamic i18n lookup
        binding: shortcuts[id]
      }))
      // ... rest of filtering logic
  }, [shortcuts, filter, t]);
  // ...
}
```

**Translation File Structure:**

```json
// messages/en.json
{
  "settings": {
    "keyboardShortcuts": {
      "labels": {
        "open-search": "Open command palette",
        "open-settings": "Open settings",
        "new": "New (contextual)",
        "save": "Save (contextual)",
        "navigate-dashboard": "Navigate: Dashboard",
        "navigate-chat": "Navigate: Chat",
        "navigate-settings": "Navigate: Settings",
        "help": "Show shortcuts help",
        "tab-next": "Next tab/window",
        "tab-prev": "Previous tab/window"
      }
    }
  }
}

// messages/zh-CN.json
{
  "settings": {
    "keyboardShortcuts": {
      "labels": {
        "open-search": "打开命令面板",
        "open-settings": "打开设置",
        "new": "新建（上下文相关）",
        "save": "保存（上下文相关）",
        "navigate-dashboard": "导航：仪表板",
        "navigate-chat": "导航：聊天",
        "navigate-settings": "导航：设置",
        "help": "显示快捷键帮助",
        "tab-next": "下一个标签页/窗口",
        "tab-prev": "上一个标签页/窗口"
      }
    }
  }
}
```

**Detailed Breakdown:**

| Issue # | Key ID | English String | Suggested Key Path | Type |
|---------|--------|----------------|-------------------|------|
| 1 | open-search | Open command palette | settings.keyboardShortcuts.labels.open-search | Command action label |
| 2 | open-settings | Open settings | settings.keyboardShortcuts.labels.open-settings | Command action label |
| 3 | new | New (contextual) | settings.keyboardShortcuts.labels.new | Command action label |
| 4 | save | Save (contextual) | settings.keyboardShortcuts.labels.save | Command action label |
| 5 | navigate-dashboard | Navigate: Dashboard | settings.keyboardShortcuts.labels.navigate-dashboard | Navigation label |
| 6 | navigate-chat | Navigate: Chat | settings.keyboardShortcuts.labels.navigate-chat | Navigation label |
| 7 | navigate-settings | Navigate: Settings | settings.keyboardShortcuts.labels.navigate-settings | Navigation label |
| 8 | help | Show shortcuts help | settings.keyboardShortcuts.labels.help | Command action label |
| 9 | tab-next | Next tab/window | settings.keyboardShortcuts.labels.tab-next | Navigation label |
| 10 | tab-prev | Previous tab/window | settings.keyboardShortcuts.labels.tab-prev | Navigation label |

---

### ModelSettings Component

**File:** `components/settings/model-settings.tsx`
**Severity:** CRITICAL
**Total Issues:** 8

#### Issues 1-8: AI Provider Names Array

**Lines:** 15-24
**Type:** User-facing dropdown/select option labels
**Current Code:**
```tsx
const PROVIDERS: { id: ModelProvider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google (Gemini)' },
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'together', label: 'Together' },
  { id: 'azure-openai', label: 'Azure OpenAI' },
  { id: 'other', label: 'Other' },
];
```

**Issues:**
All 8 provider names are hardcoded labels displayed in Select dropdown components throughout the page. These are essential UI text choices that must be translated.

**Usage Locations:**
- Line 61: `<SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>` (models section)
- Line 112: `<SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>` (provider keys section)
- Line 135: `<div className="font-medium">{p.label}</div>` (provider keys section)

**Suggested Solution:** Replace constant with i18n lookups

**Implementation Strategy:**

```tsx
export function ModelSettings() {
  const t = useTranslations('settings.models');
  const providerIds: ModelProvider[] = [
    'anthropic', 'openai', 'google', 'ollama',
    'mistral', 'together', 'azure-openai', 'other'
  ];

  return (
    // ...
    <SelectContent>
      {providerIds.map((providerId) => (
        <SelectItem key={providerId} value={providerId}>
          {t(`providers.${providerId}`)}
        </SelectItem>
      ))}
    </SelectContent>
    // ...
  );
}
```

**Translation File Structure:**

```json
// messages/en.json
{
  "settings": {
    "models": {
      "providers": {
        "anthropic": "Anthropic",
        "openai": "OpenAI",
        "google": "Google (Gemini)",
        "ollama": "Ollama (Local)",
        "mistral": "Mistral",
        "together": "Together",
        "azure-openai": "Azure OpenAI",
        "other": "Other"
      }
    }
  }
}

// messages/zh-CN.json
{
  "settings": {
    "models": {
      "providers": {
        "anthropic": "Anthropic",
        "openai": "OpenAI",
        "google": "Google (Gemini)",
        "ollama": "Ollama (本地)",
        "mistral": "Mistral",
        "together": "Together",
        "azure-openai": "Azure OpenAI",
        "other": "其他"
      }
    }
  }
}
```

**Detailed Breakdown:**

| Issue # | Provider ID | English String | Suggested Key Path | Provider Type |
|---------|-------------|----------------|-------------------|----------------|
| 1 | anthropic | Anthropic | settings.models.providers.anthropic | Cloud API |
| 2 | openai | OpenAI | settings.models.providers.openai | Cloud API |
| 3 | google | Google (Gemini) | settings.models.providers.google | Cloud API |
| 4 | ollama | Ollama (Local) | settings.models.providers.ollama | Local/Self-hosted |
| 5 | mistral | Mistral | settings.models.providers.mistral | Cloud API |
| 6 | together | Together | settings.models.providers.together | Cloud API |
| 7 | azure-openai | Azure OpenAI | settings.models.providers.azure-openai | Cloud API |
| 8 | other | Other | settings.models.providers.other | Fallback |

---

## Summary Statistics

### By Component

| Component | File | Issues | Severity | Feature Area |
|-----------|------|--------|----------|--------------|
| FileUpload | `components/chat/file-upload.tsx` | 8 | CRITICAL | Chat |
| KeyboardShortcutsEditor | `components/settings/keyboard-shortcuts-editor.tsx` | 10 | CRITICAL | Settings |
| ModelSettings | `components/settings/model-settings.tsx` | 8 | CRITICAL | Settings |
| **TOTAL** | | **26** | **CRITICAL** | **Multi-area** |

### By Severity

| Severity | Count | Examples |
|----------|-------|----------|
| CRITICAL | 26 | User-facing notifications, UI labels, accessibility text |
| MODERATE | 0 | — |
| LOW | 0 | — |

### By Type

| Type | Count | Examples |
|------|-------|----------|
| User-facing UI text | 10 | Keyboard shortcut labels, Provider names |
| Toast notifications (error/success) | 4 | File processing messages, success confirmations |
| Accessibility labels | 6 | aria-labels, alt-text, titles, tooltips |
| Dynamic/Interpolated | 6 | Messages with file counts, provider counts, file names |

---

## Implementation Priority

### Immediate (Phase 1)
- **FileUpload toast messages** - User-facing notifications, high impact
- **FileUpload aria-labels** - Accessibility requirements
- Time estimate: 1-2 hours

### High Priority (Phase 2)
- **KeyboardShortcutsEditor labels** - Settings UI critical path
- **ModelSettings provider names** - Settings UI critical path
- Time estimate: 2-3 hours

### Verification (Phase 3)
- Full component scan
- Translation key parity check
- Testing in both locales
- Time estimate: 1-2 hours

---

## Translation Key Namespace Map

**New namespaces required:**
```
settings
├── keyboardShortcuts
│   └── labels.*                  (10 keys)
└── models
    └── providers.*               (8 keys)

chat
└── fileUpload
    ├── errors.*                  (3 keys)
    ├── success.*                 (1 key with ICU plural)
    └── accessibility.*           (4 keys)
```

**Total new translation keys:** 26 in `en.json`, 26 in `zh-CN.json`


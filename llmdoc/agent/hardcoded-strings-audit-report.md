# Hardcoded Strings Audit Report

## Executive Summary

This audit identifies all hardcoded English strings in React components that should be translated using the i18n system but currently are not. The findings are organized by feature area and severity level.

**Total Findings: 9 critical hardcoded strings found across 4 components**

---

## Evidence Section

### Code Section 1: Keyboard Shortcuts Editor - Labels Array

**File:** `components/settings/keyboard-shortcuts-editor.tsx`
**Lines:** 16-27
**Purpose:** Defines hardcoded labels for keyboard shortcut actions used in the shortcuts editor UI

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

**Key Details:**
- These strings are used as display labels in the keyboard shortcuts list (line 106: `it.label`)
- All 10 labels are user-facing text that should be translated
- Currently rendered without i18n wrapper

### Code Section 2: Model Settings - Provider Labels

**File:** `components/settings/model-settings.tsx`
**Lines:** 15-24
**Purpose:** Defines hardcoded labels for AI model provider options

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

**Key Details:**
- 8 provider names are hardcoded user-facing labels
- Used in Select component dropdowns on lines 61, 112
- Rendered as SelectItem children without translation

### Code Section 3: File Upload - Toast Messages and Aria Labels

**File:** `components/chat/file-upload.tsx`
**Lines:** 85, 96, 105, 111, 144, 164-165
**Purpose:** Hardcoded user messages for file upload validation and status

```tsx
// Line 85
toast.error(`Maximum ${config.maxFiles} files allowed`);

// Line 96
toast.error(validation.error || 'Invalid file');

// Line 105
toast.error(`Failed to process ${file.name}`);

// Line 111
toast.success(`Added ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}`);

// Lines 144, 164-165
aria-label="Attach files"
// and
: 'Attach files'
```

**Key Details:**
- 5 different error/success toast messages are hardcoded
- 1 aria-label and 1 tooltip text are hardcoded
- These are user-facing notifications and accessibility labels
- Some include dynamic content (file names, counts) but base strings are hardcoded

### Code Section 4: File Upload - Image Preview Alt Text

**File:** `components/chat/file-upload.tsx`
**Line:** 251, 261
**Purpose:** Alt text and title for image and PDF preview dialogs

```tsx
// Line 251
alt="attachment preview"

// Line 261
title="PDF attachment preview"
```

**Key Details:**
- 2 hardcoded strings for image/PDF preview dialogs
- Should use i18n for accessibility and localization

---

## Findings Section

### Finding 1: Keyboard Shortcuts Editor - Unlocalized Labels

**Component:** `KeyboardShortcutsEditor`
**File Path:** `components/settings/keyboard-shortcuts-editor.tsx`
**Severity:** CRITICAL - User-facing UI text displayed in settings

**Issue Description:**
The `LABELS` constant contains 10 hardcoded shortcut descriptions that are displayed in the keyboard shortcuts editor. These are essential user-facing text that should be translated.

**Affected Strings (10 total):**
1. "Open command palette"
2. "Open settings"
3. "New (contextual)"
4. "Save (contextual)"
5. "Navigate: Dashboard"
6. "Navigate: Chat"
7. "Navigate: Settings"
8. "Show shortcuts help"
9. "Next tab/window"
10. "Previous tab/window"

**Suggested Solution:**
- Create `settings.keyboardShortcuts.labels.*` namespace in translation files
- Replace `LABELS` object with i18n lookup using `useTranslations()` hook
- Suggested translation key structure:
  ```json
  "settings": {
    "keyboardShortcuts": {
      "labels": {
        "openSearch": "Open command palette",
        "openSettings": "Open settings",
        ...
      }
    }
  }
  ```

---

### Finding 2: Model Settings - Provider Names Not Translated

**Component:** `ModelSettings`
**File Path:** `components/settings/model-settings.tsx`
**Lines:** 15-24
**Severity:** CRITICAL - User-facing provider names in dropdown menus

**Issue Description:**
The `PROVIDERS` array contains 8 hardcoded AI model provider names (Anthropic, OpenAI, Google, Ollama, Mistral, Together, Azure OpenAI, Other) that are rendered in dropdown selections throughout the component.

**Affected Strings (8 total):**
1. "Anthropic"
2. "OpenAI"
3. "Google (Gemini)"
4. "Ollama (Local)"
5. "Mistral"
6. "Together"
7. "Azure OpenAI"
8. "Other"

**Suggested Solution:**
- Move provider labels to translation files under `settings.models.providers.*` namespace
- Create dynamic provider mapping using i18n instead of hardcoded array
- Suggested translation key structure:
  ```json
  "settings": {
    "models": {
      "providers": {
        "anthropic": "Anthropic",
        "openai": "OpenAI",
        ...
      }
    }
  }
  ```

---

### Finding 3: File Upload - Unlocalized Toast Messages and Labels

**Component:** `FileUpload`
**File Path:** `components/chat/file-upload.tsx`
**Lines:** 85, 96, 105, 111, 144, 164-165
**Severity:** CRITICAL - User-facing notifications and accessibility labels

**Issue Description:**
Multiple hardcoded strings appear in the FileUpload component including toast notifications and accessibility labels that should be translated.

**Affected Strings (6 total):**

| Line | String | Context |
|------|--------|---------|
| 85 | "Maximum X files allowed" | Toast error message (file count limit) |
| 96 | "Invalid file" | Toast error message (fallback) |
| 105 | "Failed to process {filename}" | Toast error message |
| 111 | "Added X file(s)" | Toast success message (dynamic plural) |
| 144 | "Attach files" | Aria-label accessibility text |
| 164-165 | "Attach files" | Tooltip text (dynamic based on state) |

**Issues:**
- Error and success messages are user-facing notifications
- aria-label is essential for screen reader users
- Some strings contain dynamic interpolation which requires ICU format support

**Suggested Solution:**
- Add `chat.fileUpload.*` namespace to translations
- Use i18n with ICU plural format for variable counts
- Suggested translation key structure:
  ```json
  "chat": {
    "fileUpload": {
      "errors": {
        "maxFilesExceeded": "Maximum {count} files allowed",
        "invalidFile": "Invalid file",
        "processingFailed": "Failed to process {filename}"
      },
      "success": {
        "filesAdded": "{count, plural, one {# file} other {# files}} added"
      },
      "accessibility": {
        "attachButton": "Attach files",
        "maxFilesReached": "Maximum {count} files reached"
      }
    }
  }
  ```

---

### Finding 4: File Upload - Image/PDF Preview Dialog Alt Text

**Component:** `FileUpload`
**File Path:** `components/chat/file-upload.tsx`
**Lines:** 251, 261
**Severity:** MODERATE - Accessibility and localization

**Issue Description:**
Alt text and title attributes for preview dialogs are hardcoded without translation.

**Affected Strings (2 total):**
1. "attachment preview" (alt text on line 251)
2. "PDF attachment preview" (title on line 261)

**Issues:**
- Accessibility-related content should be localized
- Screen readers will not read localized text for users in other languages
- Dialog title text should match UI language

**Suggested Solution:**
- Add to `chat.fileUpload.accessibility.*` namespace
- Use i18n for accessibility strings
- Suggested keys:
  ```json
  "chat": {
    "fileUpload": {
      "accessibility": {
        "attachmentPreviewAlt": "Attachment preview",
        "pdfPreviewTitle": "PDF attachment preview"
      }
    }
  }
  ```

---

## Summary by Feature Area

### Settings Feature
- **Components Affected:** 2 (`KeyboardShortcutsEditor`, `ModelSettings`)
- **Total Hardcoded Strings:** 18
- **Severity:** CRITICAL - Core settings UI text
- **Translation Namespaces Required:**
  - `settings.keyboardShortcuts.labels.*`
  - `settings.models.providers.*`

### Chat Feature
- **Components Affected:** 1 (`FileUpload`)
- **Total Hardcoded Strings:** 8
- **Severity:** CRITICAL-MODERATE - User notifications and accessibility
- **Translation Namespaces Required:**
  - `chat.fileUpload.errors.*`
  - `chat.fileUpload.success.*`
  - `chat.fileUpload.accessibility.*`

---

## Recommended Implementation Order

### Phase 1: High Priority (User-facing notifications)
1. Translate File Upload toast messages (chat feature)
2. Translate File Upload aria-labels (accessibility)
3. Implement using i18n with plural support

### Phase 2: Medium Priority (Settings UI)
1. Translate Keyboard Shortcuts labels
2. Translate Model Provider names
3. Update component logic to use i18n lookups

### Phase 3: Verify Completeness
1. Run full component scan again
2. Test both English (en) and Simplified Chinese (zh-CN) paths
3. Verify no undefined translation keys in console

---

## Implementation Patterns to Use

### For Dynamic Strings with Variables
Use ICU message format in translation files:

```json
{
  "chat": {
    "fileUpload": {
      "filesAdded": "{count, plural, one {# file} other {# files}} added"
    }
  }
}
```

Component usage:
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('chat.fileUpload');
toast.success(t('filesAdded', { count: 3 })); // "3 files added"
```

### For Constants/Options Arrays
Avoid hardcoding, use dynamic translation lookup:

```tsx
// Before (hardcoded)
const LABELS = { 'key': 'Display Text' };

// After (with i18n)
const t = useTranslations('settings.shortcuts.labels');
const items = shortcuts.map(s => ({
  label: t(s.id),
  id: s.id
}));
```

---

## Files Modified Summary

**Files with hardcoded strings:**
1. `components/settings/keyboard-shortcuts-editor.tsx` - 10 strings
2. `components/settings/model-settings.tsx` - 8 strings
3. `components/chat/file-upload.tsx` - 8 strings

**Files that need updates:**
- `messages/en.json` - Add new namespaces
- `messages/zh-CN.json` - Add Chinese translations matching en.json structure

---

## Verification Checklist

After implementing translations:

- [ ] All hardcoded strings moved to translation files
- [ ] Both `messages/en.json` and `messages/zh-CN.json` have key parity
- [ ] No console warnings for missing translation keys
- [ ] Chinese locale path (zh-CN) displays Chinese text, not English
- [ ] ICU plural forms work correctly (test with counts 0, 1, 2+)
- [ ] Accessibility text (aria-labels) visible in translation files
- [ ] All components using `useTranslations()` properly
- [ ] TypeScript types compile without errors

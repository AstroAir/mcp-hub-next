# Hardcoded Strings - Implementation Checklist & Quick Fix Guide

## Quick Reference

**Total Findings:** 26 hardcoded strings across 3 components
**Affected Files:**
- `components/chat/file-upload.tsx` (8 strings)
- `components/settings/keyboard-shortcuts-editor.tsx` (10 strings)
- `components/settings/model-settings.tsx` (8 strings)

---

## Pre-Implementation Checklist

- [ ] Read the full audit report in `hardcoded-strings-audit-report.md`
- [ ] Review detailed findings in `hardcoded-strings-detailed-findings.md`
- [ ] Understand i18n patterns from `llmdoc/feature/internationalization-system.md`
- [ ] Understand adding translations SOP from `llmdoc/sop/adding-translatable-strings.md`
- [ ] Create feature branch: `fix/hardcoded-strings-i18n`

---

## Implementation Guide

### Step 1: Update Translation Files (5 minutes)

#### 1a. Update `messages/en.json`

Add these new sections to the JSON (maintaining proper nesting):

```json
{
  "chat": {
    "fileUpload": {
      "errors": {
        "maxFilesExceeded": "Maximum {count} files allowed",
        "invalidFile": "Invalid file",
        "processingFailed": "Failed to process {filename}"
      },
      "success": {
        "filesAdded": "{count, plural, one {Added # file} other {Added # files}}"
      },
      "accessibility": {
        "attachButton": "Attach files",
        "attachTooltip": "Attach files",
        "maxFilesReached": "Maximum {count} files reached",
        "attachmentPreviewAlt": "Attachment preview",
        "pdfPreviewTitle": "PDF attachment preview"
      }
    }
  },
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
    },
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
```

#### 1b. Update `messages/zh-CN.json`

Add Chinese translations with identical key structure:

```json
{
  "chat": {
    "fileUpload": {
      "errors": {
        "maxFilesExceeded": "最多只能上传 {count} 个文件",
        "invalidFile": "文件无效",
        "processingFailed": "处理文件失败：{filename}"
      },
      "success": {
        "filesAdded": "{count, plural, one {已添加 # 个文件} other {已添加 # 个文件}}"
      },
      "accessibility": {
        "attachButton": "附加文件",
        "attachTooltip": "附加文件",
        "maxFilesReached": "已达到最大文件数 {count}",
        "attachmentPreviewAlt": "附件预览",
        "pdfPreviewTitle": "PDF 附件预览"
      }
    }
  },
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
    },
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

**Verification:**
```bash
# Verify key structure matches between files
npm test  # Should pass i18n key parity check
```

---

### Step 2: Fix FileUpload Component (15 minutes)

**File:** `components/chat/file-upload.tsx`

#### 2a. Add i18n hook at component start (after line 36)

```tsx
import { useTranslations } from 'next-intl';

export function FileUpload({
  attachments,
  onAttachmentsChange,
  config = DEFAULT_FILE_UPLOAD_CONFIG,
  disabled = false,
  className,
  showButton = true,
  showPreview = true,
  showCount = true,
}: FileUploadProps) {
  const t = useTranslations('chat.fileUpload');  // ADD THIS LINE
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ... rest of component
}
```

#### 2b. Replace hardcoded strings in handleFileSelect function (lines 84-111)

**Before:**
```tsx
if (attachments.length + files.length > config.maxFiles) {
  toast.error(`Maximum ${config.maxFiles} files allowed`);
  return;
}

// ... later ...

if (!validation.valid) {
  toast.error(validation.error || 'Invalid file');
  continue;
}

// ... later ...

toast.error(`Failed to process ${file.name}`);

// ... later ...

toast.success(`Added ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}`);
```

**After:**
```tsx
if (attachments.length + files.length > config.maxFiles) {
  toast.error(t('errors.maxFilesExceeded', { count: config.maxFiles }));
  return;
}

// ... later ...

if (!validation.valid) {
  toast.error(validation.error || t('errors.invalidFile'));
  continue;
}

// ... later ...

toast.error(t('errors.processingFailed', { filename: file.name }));

// ... later ...

toast.success(t('success.filesAdded', { count: newAttachments.length }));
```

#### 2c. Update file input aria-label (line 144)

**Before:**
```tsx
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept={config.allowedExtensions.join(',')}
  onChange={handleFileSelect}
  className="hidden"
  disabled={disabled}
  aria-label="Attach files"
/>
```

**After:**
```tsx
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept={config.allowedExtensions.join(',')}
  onChange={handleFileSelect}
  className="hidden"
  disabled={disabled}
  aria-label={t('accessibility.attachButton')}
/>
```

#### 2d. Update tooltip content (lines 162-167)

**Before:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleButtonClick}
      disabled={disabled || attachments.length >= config.maxFiles}
      className="size-9"
    >
      <Paperclip className="size-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    {attachments.length >= config.maxFiles
      ? `Maximum ${config.maxFiles} files reached`
      : 'Attach files'}
  </TooltipContent>
</Tooltip>
```

**After:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleButtonClick}
      disabled={disabled || attachments.length >= config.maxFiles}
      className="size-9"
    >
      <Paperclip className="size-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    {attachments.length >= config.maxFiles
      ? t('accessibility.maxFilesReached', { count: config.maxFiles })
      : t('accessibility.attachTooltip')}
  </TooltipContent>
</Tooltip>
```

#### 2e. Update image preview alt text (line 250)

**Before:**
```tsx
<ImagePreviewDialog
  open={!!previewSrc}
  src={previewSrc}
  alt="attachment preview"
  onOpenChange={(o) => !o && setPreviewSrc(null)}
/>
```

**After:**
```tsx
<ImagePreviewDialog
  open={!!previewSrc}
  src={previewSrc}
  alt={t('accessibility.attachmentPreviewAlt')}
  onOpenChange={(o) => !o && setPreviewSrc(null)}
/>
```

#### 2f. Update PDF preview title (line 258-261)

**Before:**
```tsx
<PdfPreviewDialog
  open={!!pdfPreviewSrc}
  src={pdfPreviewSrc}
  title="PDF attachment preview"
  onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
/>
```

**After:**
```tsx
<PdfPreviewDialog
  open={!!pdfPreviewSrc}
  src={pdfPreviewSrc}
  title={t('accessibility.pdfPreviewTitle')}
  onOpenChange={(o) => !o && setPdfPreviewSrc(null)}
/>
```

---

### Step 3: Fix KeyboardShortcutsEditor Component (15 minutes)

**File:** `components/settings/keyboard-shortcuts-editor.tsx`

#### 3a. Remove hardcoded LABELS constant (lines 16-27)

**Before:**
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

**Delete this entire constant.**

#### 3b. Update component function (add i18n hook)

**Before:**
```tsx
export function KeyboardShortcutsEditor() {
  const t = useTranslations('settings.keyboardShortcuts');

  const { shortcuts, setShortcut, resetSection } = useSettingsStore();
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [conflict, setConflict] = useState<{ action: ShortcutAction } | null>(null);

  const items = useMemo(() => {
    return (Object.keys(shortcuts) as ShortcutAction[])
      .map((id) => ({ id, label: LABELS[id], binding: shortcuts[id] }))
      .filter((it) =>
        it.label.toLowerCase().includes(filter.toLowerCase()) ||
        it.binding.toLowerCase().includes(filter.toLowerCase())
      );
  }, [shortcuts, filter]);
```

**After:**
```tsx
export function KeyboardShortcutsEditor() {
  const t = useTranslations('settings.keyboardShortcuts');
  const labelT = useTranslations('settings.keyboardShortcuts.labels');  // ADD THIS

  const { shortcuts, setShortcut, resetSection } = useSettingsStore();
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [conflict, setConflict] = useState<{ action: ShortcutAction } | null>(null);

  const items = useMemo(() => {
    return (Object.keys(shortcuts) as ShortcutAction[])
      .map((id) => ({ id, label: labelT(id), binding: shortcuts[id] }))  // CHANGED THIS
      .filter((it) =>
        it.label.toLowerCase().includes(filter.toLowerCase()) ||
        it.binding.toLowerCase().includes(filter.toLowerCase())
      );
  }, [shortcuts, filter, labelT]);  // ADDED labelT to dependencies
```

---

### Step 4: Fix ModelSettings Component (15 minutes)

**File:** `components/settings/model-settings.tsx`

#### 4a. Convert PROVIDERS constant to dynamic lookup

**Before:**
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

export function ModelSettings() {
  const t = useTranslations('settings.models');
  const { models, providerAuth, addModel, updateModel, removeModel, setDefaultModel, defaultModelId, setProviderAuth } = useModelStore();
  const [draft, setDraft] = useState({ id: '', label: '', provider: 'openai' as ModelProvider });
```

**After:**
```tsx
const PROVIDER_IDS: ModelProvider[] = [
  'anthropic',
  'openai',
  'google',
  'ollama',
  'mistral',
  'together',
  'azure-openai',
  'other',
];

export function ModelSettings() {
  const t = useTranslations('settings.models');
  const providerT = useTranslations('settings.models.providers');  // ADD THIS
  const { models, providerAuth, addModel, updateModel, removeModel, setDefaultModel, defaultModelId, setProviderAuth } = useModelStore();
  const [draft, setDraft] = useState({ id: '', label: '', provider: 'openai' as ModelProvider });

  // Helper to get provider label
  const getProviderLabel = (id: ModelProvider) => providerT(id);
```

#### 4b. Replace all PROVIDERS references

Find and replace all occurrences of `PROVIDERS` with `PROVIDER_IDS`:

1. **Line ~60:** Replace in SelectContent for provider selection
```tsx
// Before
{PROVIDERS.map((p) => (
  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
))}

// After
{PROVIDER_IDS.map((providerId) => (
  <SelectItem key={providerId} value={providerId}>
    {getProviderLabel(providerId)}
  </SelectItem>
))}
```

2. **Line ~111:** Replace in provider dropdown in form
```tsx
// Before
{PROVIDERS.map((p) => (
  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
))}

// After
{PROVIDER_IDS.map((providerId) => (
  <SelectItem key={providerId} value={providerId}>
    {getProviderLabel(providerId)}
  </SelectItem>
))}
```

3. **Line ~133:** Replace in provider keys section header
```tsx
// Before
{PROVIDERS.map((p) => (
  <div key={p.id} className="border rounded-lg p-3 space-y-2">
    <div className="font-medium">{p.label}</div>
    {/* ... */}
  </div>
))}

// After
{PROVIDER_IDS.map((providerId) => (
  <div key={providerId} className="border rounded-lg p-3 space-y-2">
    <div className="font-medium">{getProviderLabel(providerId)}</div>
    {/* ... */}
  </div>
))}
```

---

### Step 5: Testing (10 minutes)

#### 5a. Run tests
```bash
npm test
# Verify: i18n key parity check passes
# Verify: no TypeScript errors
```

#### 5b. Manual testing - English locale
```bash
npm run dev
# Visit http://localhost:3000/en/settings
# Verify all provider names and shortcuts display correctly
# Test file upload with toast messages
```

#### 5c. Manual testing - Chinese locale
```bash
# Visit http://localhost:3000/zh-CN/settings
# Verify Chinese text displays (not English)
# Verify provider names appear in Chinese where translated
# Test file upload toast messages in Chinese
# Test keyboard shortcuts display in Chinese
```

#### 5d. Console verification
- Open browser DevTools console
- No warnings about missing translation keys
- No "undefined" values appearing in UI

---

## Verification Checklist

### Pre-Commit
- [ ] All translation keys added to `messages/en.json`
- [ ] All translation keys added to `messages/zh-CN.json` with Chinese text
- [ ] Key structure identical between en.json and zh-CN.json
- [ ] No duplicate keys
- [ ] Valid JSON syntax (use `npm test` to verify)

### Code Changes
- [ ] `components/chat/file-upload.tsx` - all 8 hardcoded strings replaced
- [ ] `components/settings/keyboard-shortcuts-editor.tsx` - LABELS constant removed, i18n integrated
- [ ] `components/settings/model-settings.tsx` - PROVIDERS constant converted to dynamic lookup
- [ ] All components have `useTranslations()` hook imported
- [ ] No TypeScript compilation errors

### Testing
- [ ] `npm test` passes (including i18n key parity)
- [ ] English locale displays all text correctly
- [ ] Chinese locale displays Chinese translations (verify at least 5 strings)
- [ ] No console warnings about missing keys
- [ ] File upload toasts work with dynamic counts
- [ ] Keyboard shortcuts render correctly
- [ ] Model provider dropdowns functional

### Final Review
- [ ] Commit message references hardcoded strings fix
- [ ] All files ready for PR
- [ ] Documentation updated (this checklist can be removed after completion)

---

## Quick Reference: Key Paths

### Chat File Upload
```
chat.fileUpload.errors.maxFilesExceeded
chat.fileUpload.errors.invalidFile
chat.fileUpload.errors.processingFailed
chat.fileUpload.success.filesAdded
chat.fileUpload.accessibility.attachButton
chat.fileUpload.accessibility.attachTooltip
chat.fileUpload.accessibility.maxFilesReached
chat.fileUpload.accessibility.attachmentPreviewAlt
chat.fileUpload.accessibility.pdfPreviewTitle
```

### Settings Keyboard Shortcuts
```
settings.keyboardShortcuts.labels.open-search
settings.keyboardShortcuts.labels.open-settings
settings.keyboardShortcuts.labels.new
settings.keyboardShortcuts.labels.save
settings.keyboardShortcuts.labels.navigate-dashboard
settings.keyboardShortcuts.labels.navigate-chat
settings.keyboardShortcuts.labels.navigate-settings
settings.keyboardShortcuts.labels.help
settings.keyboardShortcuts.labels.tab-next
settings.keyboardShortcuts.labels.tab-prev
```

### Settings Model Providers
```
settings.models.providers.anthropic
settings.models.providers.openai
settings.models.providers.google
settings.models.providers.ollama
settings.models.providers.mistral
settings.models.providers.together
settings.models.providers.azure-openai
settings.models.providers.other
```

---

## Rollback Instructions

If something goes wrong:

```bash
# Revert translation file changes
git checkout messages/en.json messages/zh-CN.json

# Revert component changes
git checkout components/chat/file-upload.tsx
git checkout components/settings/keyboard-shortcuts-editor.tsx
git checkout components/settings/model-settings.tsx

# Start over
npm install
npm test
```

---

## Time Estimate

- Translation file updates: 5 minutes
- FileUpload component: 15 minutes
- KeyboardShortcutsEditor component: 15 minutes
- ModelSettings component: 15 minutes
- Testing and verification: 10 minutes
- **Total: 60 minutes (1 hour)**


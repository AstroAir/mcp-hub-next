# i18n Audit Summary

## Quick Overview

**Audit Date:** 2025-11-11
**Status:** 96.2% complete - 4 critical issues blocking 100% coverage
**Current Locales Supported:** English (en), Simplified Chinese (zh-CN)

---

## Key Findings

### 1. CRITICAL: Missing 62 Translation Keys

**Impact:** Chinese users see English text in these features
**Fix Time:** 1.5 hours
**Files Affected:** `messages/zh-CN.json`

#### Breakdown:
- **Marketplace:** 47 keys missing (0% translated)
  - Filters, cards, toasts, details, view sections
- **Chat Messages:** 15 keys missing (partial translation)
  - Attachments, tool calls, file previews
- **Accessibility:** 1 key missing
  - Home link aria-label

**Status:** Translation keys exist in `en.json` but not in `zh-CN.json`

---

### 2. CRITICAL: Hardcoded Navigation Labels

**Impact:** Navigation menu always shows English labels
**Fix Time:** 1 hour
**Files Affected:** 2 components

#### Details:
| Component | Labels | Status |
|-----------|--------|--------|
| `components/layout/app-sidebar.tsx` | Dashboard, Marketplace, Chat, Developer, Settings | Hardcoded |
| `components/layout/navbar.tsx` | Dashboard, Chat, Developer, Settings | Hardcoded |
| `components/layout/site-header.tsx` | Home (aria-label) | Hardcoded |

**Solution:** Use `useTranslations()` hook with existing `common.navigation` keys

---

### 3. HIGH: Locale Support Inconsistency

**Impact:** Users can select unsupported locales (Japanese, Spanish)
**Fix Time:** 30 minutes
**Files Affected:** `messages/en.json`, `messages/zh-CN.json`

#### Issue:
Settings UI lists 4 locales:
- English ✓ Supported
- Chinese ✓ Supported
- Japanese ✗ **NOT supported** (no translation file)
- Spanish ✗ **NOT supported** (no translation file)

**Routing Configuration:** Only defines 2 locales (`i18n/routing.ts`)

**Solution:** Remove ja/es from settings UI or create translation files

---

### 4. MEDIUM: Service-Layer Error Messages

**Impact:** Error messages not localized
**Fix Time:** 1 hour
**Files Affected:** `lib/services/mcp-client.ts`, `lib/services/backup-service.ts`

#### Details:
- Rate limit error in MCP client (hardcoded message)
- 2 backup service errors (hardcoded messages)

**Solution:** Use error codes + translate in UI layer

---

## Translation Coverage by Feature

| Feature | Files Translated | Status | Examples |
|---------|------------------|--------|----------|
| Dashboard | ✓ | 100% | Server list, filters, buttons |
| Chat | ~80% | 95% translated, 15 keys missing | Message display incomplete |
| Marketplace | ✗ | 0% translated | All marketplace features show English |
| Settings | ✓ | 100% | Configuration options fully translated |
| Navigation | ✗ | 0% translated | Menu labels hardcoded |
| Error Pages | ✓ | 100% | 404, error boundary pages translated |

---

## Component Internationalization Status

**Fully Localized:** ~70% of codebase
- All page-level components use `useTranslations()`
- Error handling components properly translated
- Settings UI properly translated

**Not Localized:** ~30% of codebase
- Navigation components (sidebar, navbar)
- Some accessibility labels
- Service layer errors
- Marketplace feature (keys missing from zh-CN.json)

---

## What Works Well

✓ i18n routing with `next-intl` properly configured
✓ Main page layouts and flows properly translated
✓ Settings UI has complete translation coverage
✓ Error pages/boundaries properly localized
✓ Chat interface (main components) properly localized
✓ Dashboard and server management properly localized
✓ Toast/notification messages consistently translated

---

## What Needs Fixing

**Immediate (Blocking):**
1. Add 62 missing keys to zh-CN.json
2. Translate navigation components
3. Resolve unsupported locale issue

**Important (High Priority):**
4. Add accessibility label translations
5. Refactor service error handling

**Nice to Have (Low Priority):**
6. Document i18n patterns
7. Add locale support for ja/es

---

## File-by-File Analysis

### Translation Files

| File | Status | Keys | Coverage |
|------|--------|------|----------|
| `messages/en.json` | ✓ Complete | 1,632 | 100% |
| `messages/zh-CN.json` | ⚠ Incomplete | 1,570 | 96.2% |
| `messages/ja.json` | ✗ Missing | — | Not supported |
| `messages/es.json` | ✗ Missing | — | Not supported |

### Component Files with Issues

| File | Issues | Severity |
|------|--------|----------|
| `components/layout/app-sidebar.tsx` | 5 hardcoded nav labels | CRITICAL |
| `components/layout/navbar.tsx` | 4 hardcoded nav labels | CRITICAL |
| `components/layout/site-header.tsx` | 1 hardcoded aria-label | HIGH |
| `lib/services/mcp-client.ts` | 1 error message | MEDIUM |
| `lib/services/backup-service.ts` | 2 error messages | MEDIUM |

### Configuration Files

| File | Status | Issue |
|------|--------|-------|
| `i18n/routing.ts` | ✓ Correct | Only 2 locales defined |
| `i18n/request.ts` | ✓ Correct | Proper message loading |
| `messages/en.json` | ✓ Correct | Lists 4 locales (2 unsupported) |
| `messages/zh-CN.json` | ⚠ Incomplete | Lists 4 locales, missing 62 keys |

---

## Specific Missing Translations (62 keys)

### Marketplace Section (47 keys)

**Filters (13 keys):**
- searchPlaceholder, sort options (stars, downloads, updated, name)
- category placeholder/all
- tags button/dropdown label
- quick filters (recommended, noApiKey)
- reset button

**Card Display (10 keys):**
- recommended badge
- author display
- stats (stars, downloads, requires API key)
- buttons (GitHub, Install, Installing, Details)
- dialog (installing)

**Toasts & Details (12 keys):**
- Installation toasts
- Detail stats/meta
- MCP ID copy/copied
- Actions and README

**View (12 keys):**
- Title and subtitle
- Actions and states
- Result count

### Chat Message Section (15 keys)

**Attachments (2 keys):**
- attachmentsCount
- attachmentIcon

**File Preview (3 keys):**
- previewPdf, previewButton, pdfPreviewTitle

**Tooltips (2 keys):**
- previewTooltip, downloadTooltip

**Tool Calls (7 keys):**
- title, parameters, response, unknownError
- status (requested, success, error)

**Misc (1 key):**
- imagePreviewAlt

### Accessibility (1 key)

- common.a11y.home (for breadcrumb home link aria-label)

---

## Hardcoded Strings Inventory

### Navigation Labels

**App Sidebar (5 strings):**
```
"Dashboard"
"Marketplace"
"Chat"
"Developer"
"Settings"
```

**Navbar (4 strings):**
```
"Dashboard"
"Chat"
"Developer"
"Settings"
```

### Accessibility Labels

**Site Header (1 string):**
```
aria-label="Home"
```

### Brand Names

**App Sidebar + Navbar (2 instances):**
```
"MCP Hub"
```

### Service Layer Errors

**MCP Client (1 message):**
```
"Rate limit exceeded. Retry after {n} seconds."
```

**Backup Service (2 messages):**
```
"Backups can only be created in browser environment"
"Invalid backup file format"
```

---

## Implementation Priority

### Priority 1: Critical (Block 100% Coverage)

1. **Add 62 missing keys to zh-CN.json** → 1.5 hours
   - Unblocks marketplace for Chinese users
   - Unblocks chat messages for Chinese users

2. **Update navigation components** → 1 hour
   - Translate sidebar labels
   - Translate navbar labels
   - Translate breadcrumb aria-label

### Priority 2: High (Data Integrity)

3. **Resolve unsupported locales** → 30 minutes
   - Remove ja/es from UI or create files
   - Ensure consistency

### Priority 3: Important (User Experience)

4. **Localize service errors** → 1 hour
   - Error messages properly translated
   - Better error handling patterns

### Priority 4: Nice-to-Have (Documentation)

5. **Update i18n documentation** → 30 minutes
   - Guidelines for future translations
   - Common patterns

---

## Testing Checklist

Before marking as complete:

**Translation Coverage:**
- [ ] All keys in en.json exist in zh-CN.json
- [ ] Marketplace section (47 keys) translated
- [ ] Chat messages section (15 keys) translated
- [ ] Accessibility labels translated

**Component Testing:**
- [ ] Sidebar renders all 5 nav items in English
- [ ] Sidebar renders all 5 nav items in Chinese
- [ ] Navbar renders all 4 nav items in English
- [ ] Navbar renders all 4 nav items in Chinese
- [ ] Breadcrumb home link has correct aria-label (both locales)

**Marketplace Testing:**
- [ ] Marketplace page loads in Chinese
- [ ] Filter labels display in Chinese
- [ ] Card labels display in Chinese
- [ ] Toasts display in Chinese

**Chat Testing:**
- [ ] Chat messages display in Chinese
- [ ] Tool calls display in Chinese
- [ ] File previews display in Chinese

**Settings Testing:**
- [ ] Locale selector shows only 2 options
- [ ] No console errors when switching locales
- [ ] Error handling shows translated messages

**Accessibility Testing:**
- [ ] Screen reader reads nav items correctly
- [ ] aria-labels are in correct language
- [ ] No accessibility regressions

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Translation key coverage | 96.2% | 100% | ⚠ Missing 62 keys |
| Component i18n coverage | 70% | 100% | ⚠ 4 components hardcoded |
| Hardcoded string count | 10+ | 0 | ✗ Critical |
| Locale configuration consistency | 50% | 100% | ⚠ ja/es unsupported |
| Service error localization | 0% | 100% | ✗ Not implemented |

---

## Documentation References

Three detailed documents created during this audit:

1. **`i18n-implementation-audit.md`** (This Investigation)
   - Complete evidence of all findings
   - Detailed code section analysis
   - Translation coverage breakdown

2. **`i18n-hardcoded-strings-inventory.md`** (Code Examples)
   - Every hardcoded string identified
   - Proposed fixes for each issue
   - Before/after code examples
   - Translation key recommendations

3. **`i18n-completion-roadmap.md`** (Implementation Plan)
   - Step-by-step fix instructions
   - Code change checklist
   - Testing procedures
   - Resource requirements (6-7 hours)

---

## Recommendations

### Immediate Actions (Today)

1. Review this audit with team
2. Prioritize Phase 1 fixes (critical fixes, 2-3 hours)
3. Add Phase 1 changes to sprint/board

### Short-term (This Sprint)

4. Complete all 4 phases from roadmap (6-7 hours)
5. Add i18n testing to CI/CD pipeline
6. Document i18n patterns for future work

### Long-term (Future Sprints)

7. Consider adding ja/es locale support (if prioritized by product)
8. Create i18n style guide for team
9. Implement translation management system (for larger scale)

---

## Questions & Decisions

**Q: Should "MCP Hub" be translated?**
A: Typically brand names remain in English. Recommend keeping as constant. Create config variable for consistency.

**Q: Should we add Japanese and Spanish support?**
A: Not currently. Recommend removing from UI to avoid user confusion. Can add later with dedicated translation effort.

**Q: How to handle service layer errors long-term?**
A: Use error codes + translate in UI layer. This allows UI to show appropriate user-friendly messages while services remain language-agnostic.

---

## Contact & Support

This audit was conducted with comprehensive code analysis. All findings are based on:
- Direct code inspection of 50+ files
- Translation key comparison (en.json vs zh-CN.json)
- Component hardcoding analysis
- Service layer error message review

For questions or clarifications, refer to the detailed audit documents.

---

**Audit Complete** ✓
**Status:** Ready for implementation
**Estimated Completion:** 6-7 developer hours


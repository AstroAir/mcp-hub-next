# Standard: Developing Responsive Components

## 1. Purpose

This SOP ensures that all new components and UI modifications adhere to mobile-first responsive design principles, guaranteeing usability across mobile (320px+), tablet (640px+), and desktop (1024px+) viewports. Following this process prevents common responsiveness issues and ensures WCAG 2.5 Level AAA compliance for touch targets.

## 2. Step-by-Step Guide

### Step 1: Design for Mobile First
1. Identify the mobile viewport requirement (typically 320px minimum)
2. Apply base Tailwind CSS classes optimized for that width (no breakpoint prefix)
3. Example: `grid-cols-1 px-2 py-3` (not `md:grid-cols-2`)

### Step 2: Apply Responsive Breakpoints
Use Tailwind's responsive prefixes to progressively enhance for larger screens:

| Breakpoint | Prefix | Min-Width | Use Case |
|-----------|--------|-----------|----------|
| SM        | sm:    | 640px     | Tablets, large phones |
| MD        | md:    | 768px     | iPad, medium tablets |
| LG        | lg:    | 1024px    | Desktop layouts, sidebar visibility |
| XL        | xl:    | 1280px    | Large desktop (optional) |

**Pattern**: `class="base-class sm:tablet-class md:medium-class lg:desktop-class"`

### Step 3: Validate Touch Target Sizes
All interactive elements must meet minimum size requirements:

| Viewport | Min Size | Tailwind Class Pattern | Example |
|----------|----------|----------------------|---------|
| Mobile < 640px | 44×44px | size-11 or h-11 w-11 | Buttons, icon buttons |
| Desktop ≥ 640px | 24-28px | size-7 or h-7 w-7 | Smaller, hoverable buttons |

**Implementation**: Use responsive sizing: `size-11 sm:size-7`

### Step 4: Test Text Visibility on Mobile
For space-constrained mobile layouts, conditionally hide text labels:

```tsx
<button>
  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
  <span className="hidden sm:inline">Label Text</span>
</button>
```

### Step 5: Handle Grid/List Layouts
Responsive grid columns follow this pattern:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

- Mobile: 1 column (full width minus padding)
- Tablet: 2 columns
- Desktop: 3+ columns

### Step 6: Manage Container Padding
Use responsive padding to optimize space usage:

```tsx
className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3"
```

- Mobile: Tighter padding (8-12px horizontal)
- Desktop: More generous padding (24px+ horizontal)

### Step 7: Responsive Scroll Areas
For scrollable containers with fixed heights, use responsive sizing:

```tsx
<ScrollArea className="h-[200px] sm:h-[300px] md:h-[400px]">
```

Test on actual small phone screens (320px) to ensure content is readable.

### Step 8: Sidebar/Drawer Components
Use Sheet component for mobile sidebars, hidden responsive wrapper for desktop:

**Mobile (< lg breakpoint)**:
```tsx
{!isDesktop && (
  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
    <SheetTrigger>
      <Menu className="lg:hidden" />
    </SheetTrigger>
    <SheetContent side="left">
      {/* Sidebar content */}
    </SheetContent>
  </Sheet>
)}
```

**Desktop (≥ lg breakpoint)**:
```tsx
<div className="hidden lg:flex w-64">
  {/* Sidebar content */}
</div>
```

### Step 9: Test on Multiple Viewports
1. Test on mobile phone (375px, 414px widths)
2. Test on small phone (320px width) - Edge case
3. Test on tablet portrait (768px width)
4. Test on tablet landscape (1024px width)
5. Test on desktop (1280px+ width)

Use browser DevTools responsive mode or actual devices.

### Step 10: Verify No Horizontal Scrolling
1. Set browser to mobile viewport (e.g., 375px)
2. Interact with all elements
3. Verify no horizontal scrolling bar appears
4. Check that text doesn't overflow container widths

## 3. Relevant Code Modules

- `/components/chat/chat-message.tsx` - Reference for responsive button sizing and grid layout
- `/components/chat/chat-input.tsx` - Reference for responsive send button implementation
- `/app/[locale]/chat/page.tsx` - Reference for Sheet + responsive wrapper pattern
- `/components/mcp/server-detail-view.tsx` - Reference for responsive scroll area heights
- `/components/settings/model-settings.tsx` - Reference for responsive form grid layout

## 4. Attention

1. **Never use fixed widths on main content**: Avoid `w-[256px]`, `w-[500px]` etc. without responsive breakpoints; use `w-64 lg:w-64` if fixed width is needed on desktop only
2. **Default to base mobile classes**: All base classes (no prefix) should optimize for ≤640px viewport
3. **Test ACTUALLY on mobile**: Browser DevTools is helpful but test on real devices when possible, especially for touch target sizes
4. **Consistent breakpoint usage**: Prefer md: for most responsive changes; use sm: for fine-tuning, lg: for layout shifts
5. **Horizontal overflow is a bug**: Any component causing horizontal scroll on mobile should be treated as critical issue requiring immediate fix
6. **Icon sizing symmetry**: Icons should use width and height together to prevent distortion (size-X or h-X w-X, not just one dimension)

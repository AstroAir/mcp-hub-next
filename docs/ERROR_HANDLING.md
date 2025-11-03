# Error Handling Documentation

This document describes the error handling system implemented in the MCP Hub Next application.

## Overview

The application uses a comprehensive error handling system with multiple layers:

1. **Global Error Boundary** (`app/global-error.tsx`) - Catches critical errors in the root layout
2. **Route Error Boundaries** (`app/error.tsx`) - Catches errors in specific routes
3. **Route-Specific Error Boundaries** - Custom error pages for each major route
4. **Not Found Page** (`app/not-found.tsx`) - Handles 404 errors
5. **Loading States** (`app/loading.tsx`) - Displays loading UI during data fetching
6. **Reusable Error Components** - Shared components for consistent error display

## Error Boundary Hierarchy

```
app/
├── global-error.tsx          # Critical errors (wraps entire app)
├── error.tsx                 # General application errors
├── not-found.tsx             # 404 errors
├── loading.tsx               # Loading states
├── chat/
│   └── error.tsx            # Chat-specific errors
├── developer/
│   └── error.tsx            # Developer tools errors
└── settings/
    └── error.tsx            # Settings page errors
```

## Components

### Global Error Boundary (`app/global-error.tsx`)

Catches critical errors that prevent the entire application from loading.

**Features:**
- Full-page error display
- Error logging to console (and error tracking service in production)
- Reload application button
- Error ID display (digest)

**When it triggers:**
- Errors in the root layout
- Critical runtime errors
- Unhandled promise rejections

### Route Error Boundary (`app/error.tsx`)

Catches errors within the application routes.

**Features:**
- Card-based error display matching dashboard theme
- Error message and digest display
- Multiple recovery actions:
  - Try Again (reset error boundary)
  - Go to Dashboard
  - Report Issue (opens GitHub issues)
- Responsive design
- Error logging

**When it triggers:**
- Component rendering errors
- Data fetching errors
- Runtime errors in page components

### Not Found Page (`app/not-found.tsx`)

Displays when a page or resource is not found (404).

**Features:**
- User-friendly 404 message
- Large "404" display
- Helpful navigation links
- Consistent card-based design

**When it triggers:**
- Invalid URLs
- Deleted resources
- Missing pages

### Loading State (`app/loading.tsx`)

Displays while pages are loading.

**Features:**
- Animated loading spinner
- Skeleton loaders
- Card-based design
- Loading message

**When it triggers:**
- Route transitions
- Data fetching
- Suspense boundaries

### Route-Specific Error Boundaries

Each major route has its own error boundary:

- **Chat Error** (`app/chat/error.tsx`) - MessageSquare icon
- **Developer Error** (`app/developer/error.tsx`) - Bug icon
- **Settings Error** (`app/settings/error.tsx`) - Settings icon

**Features:**
- Route-specific icons and messages
- Uses reusable `ErrorState` component
- Consistent error handling across routes

## Reusable Components

### ErrorState Component (`components/error/error-state.tsx`)

A flexible component for displaying errors in different contexts.

**Props:**
```typescript
interface ErrorStateProps {
  title?: string;                    // Error title
  description?: string;              // Error description
  error?: Error | string;            // Error object or message
  icon?: LucideIcon;                 // Custom icon
  showHomeButton?: boolean;          // Show "Go to Dashboard" button
  showRetryButton?: boolean;         // Show "Try Again" button
  onRetry?: () => void;             // Retry callback
  className?: string;                // Additional CSS classes
}
```

**Usage:**
```tsx
import { ErrorState } from '@/components/error/error-state';
import { MessageSquare } from 'lucide-react';

<ErrorState
  title="Chat Error"
  description="Failed to load chat interface"
  error={error}
  icon={MessageSquare}
  onRetry={reset}
/>
```

### EmptyState Component (`components/error/empty-state.tsx`)

Displays when there's no data to show.

**Props:**
```typescript
interface EmptyStateProps {
  title?: string;                    // Empty state title
  description?: string;              // Empty state description
  icon?: LucideIcon;                 // Custom icon
  action?: {                         // Optional action button
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;              // Additional content
  className?: string;                // Additional CSS classes
}
```

**Usage:**
```tsx
import { EmptyState } from '@/components/error/empty-state';
import { Inbox } from 'lucide-react';

<EmptyState
  title="No servers found"
  description="Add your first MCP server to get started"
  icon={Inbox}
  action={{
    label: "Add Server",
    onClick: () => setDialogOpen(true)
  }}
/>
```

## Design System

All error pages follow the admin dashboard design system:

### Visual Elements
- **Card-based layout** - Consistent with dashboard components
- **Icon indicators** - Visual representation of error type
- **Color coding:**
  - Destructive (red) - Errors and critical issues
  - Muted - 404 and empty states
  - Primary - Loading states

### Typography
- **Title:** Large, bold text (text-2xl to text-3xl)
- **Description:** Muted foreground color
- **Error messages:** Alert component with destructive variant

### Spacing
- Consistent padding and margins
- Responsive design (mobile and desktop)
- Centered layout for better focus

### Actions
- Primary action (Try Again) - Default button variant
- Secondary action (Go to Dashboard) - Outline variant
- Tertiary action (Report Issue) - Ghost variant

## Error Logging

### Development
All errors are logged to the browser console with full stack traces.

### Production
Errors should be sent to an error tracking service (e.g., Sentry, LogRocket).

**Implementation example:**
```typescript
if (process.env.NODE_ENV === 'production') {
  // Send to error tracking service
  Sentry.captureException(error);
}
```

## Testing Error Handling

A test page is available at `/test-error` for testing error boundaries:

**Features:**
- Trigger error boundary
- Navigate to 404 page
- Test loading states

**⚠️ Note:** Remove this page in production.

## Best Practices

1. **Always provide context** - Include helpful error messages and recovery actions
2. **Log errors** - Ensure all errors are logged for debugging
3. **User-friendly messages** - Avoid technical jargon in user-facing messages
4. **Provide recovery options** - Always offer ways to recover from errors
5. **Consistent design** - Use the provided components for consistency
6. **Route-specific handling** - Create custom error boundaries for complex routes
7. **Test error scenarios** - Regularly test error handling during development

## Accessibility

All error pages are designed with accessibility in mind:

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
- Focus management

## Future Enhancements

Potential improvements to the error handling system:

1. **Error tracking integration** - Sentry, LogRocket, or similar
2. **Error analytics** - Track error frequency and patterns
3. **User feedback** - Allow users to provide context when reporting errors
4. **Offline support** - Special handling for network errors
5. **Error recovery strategies** - Automatic retry with exponential backoff
6. **Error boundaries for components** - More granular error handling
7. **Custom error types** - Different handling for different error types

## Related Files

- `app/global-error.tsx` - Global error boundary
- `app/error.tsx` - Route error boundary
- `app/not-found.tsx` - 404 page
- `app/loading.tsx` - Loading state
- `components/error/error-state.tsx` - Reusable error component
- `components/error/empty-state.tsx` - Empty state component
- `components/mcp/error-alert.tsx` - Inline error alerts


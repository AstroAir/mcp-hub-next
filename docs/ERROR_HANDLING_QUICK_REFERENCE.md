# Error Handling Quick Reference

## Quick Start

### Using ErrorState Component

```tsx
import { ErrorState } from '@/components/error/error-state';
import { AlertCircle } from 'lucide-react';

// Basic usage
<ErrorState
  title="Something went wrong"
  description="Failed to load data"
  error={error}
/>

// With custom icon and retry
<ErrorState
  title="Connection Failed"
  description="Unable to connect to server"
  error={error}
  icon={AlertCircle}
  onRetry={() => refetch()}
  showHomeButton={true}
/>
```

### Using EmptyState Component

```tsx
import { EmptyState } from '@/components/error/empty-state';
import { Inbox } from 'lucide-react';

// Basic usage
<EmptyState
  title="No items found"
  description="Start by adding your first item"
/>

// With action button
<EmptyState
  title="No servers configured"
  description="Add your first MCP server to get started"
  icon={Inbox}
  action={{
    label: "Add Server",
    onClick: () => openDialog()
  }}
/>
```

### Creating Route-Specific Error Boundary

```tsx
// app/my-route/error.tsx
'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/error/error-state';
import { MyIcon } from 'lucide-react';

export default function MyRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('My route error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <ErrorState
        title="My Route Error"
        description="An error occurred in my route"
        error={error}
        icon={MyIcon}
        onRetry={reset}
      />
    </div>
  );
}
```

## File Structure

```
app/
├── global-error.tsx          # Critical errors (entire app)
├── error.tsx                 # General errors
├── not-found.tsx             # 404 errors
├── loading.tsx               # Loading states
├── test-error/               # Testing page (remove in production)
│   └── page.tsx
├── chat/
│   └── error.tsx            # Chat route errors
├── developer/
│   └── error.tsx            # Developer route errors
└── settings/
    └── error.tsx            # Settings route errors

components/error/
├── error-state.tsx           # Reusable error component
└── empty-state.tsx           # Empty state component

docs/
├── ERROR_HANDLING.md         # Full documentation
└── ERROR_HANDLING_QUICK_REFERENCE.md  # This file
```

## Common Patterns

### 1. Inline Error Alert

```tsx
import { ErrorAlert } from '@/components/mcp/error-alert';

{error && (
  <ErrorAlert
    title="Error"
    message={error.message}
    onDismiss={() => setError(null)}
  />
)}
```

### 2. Loading State with Error Fallback

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/error/error-state';

if (isLoading) {
  return <LoadingSpinner size="lg" />;
}

if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}

return <YourComponent data={data} />;
```

### 3. Empty State with Action

```tsx
import { EmptyState } from '@/components/error/empty-state';

if (items.length === 0) {
  return (
    <EmptyState
      title="No items"
      description="Get started by adding your first item"
      action={{
        label: "Add Item",
        onClick: () => setDialogOpen(true)
      }}
    />
  );
}
```

### 4. Custom Error Boundary

```tsx
'use client';

import { Component, ReactNode } from 'react';
import { ErrorState } from '@/components/error/error-state';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CustomErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorState
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

## Testing

### Test Error Boundary

Visit `/test-error` to test error handling (development only).

### Manual Testing

```tsx
// Trigger error in component
if (shouldError) {
  throw new Error('Test error');
}

// Test 404
router.push('/non-existent-page');

// Test loading
const { data, isLoading } = useQuery(...);
```

## Styling

All error components use the dashboard theme:

- **Card-based layout** for consistency
- **shadcn/ui components** (Card, Button, Alert)
- **Lucide icons** for visual indicators
- **Responsive design** (mobile and desktop)
- **Color variants:**
  - `destructive` - Errors
  - `muted` - Empty states
  - `primary` - Loading states

## Icons

Common icons for error states:

```tsx
import {
  AlertCircle,      // General errors
  AlertTriangle,    // Warnings
  FileQuestion,     // 404 errors
  Inbox,           // Empty states
  Loader2,         // Loading
  Bug,             // Developer errors
  MessageSquare,   // Chat errors
  Settings,        // Settings errors
  Home,            // Navigation
  RefreshCw,       // Retry action
} from 'lucide-react';
```

## Best Practices

1. ✅ Always log errors to console
2. ✅ Provide clear, user-friendly messages
3. ✅ Offer recovery actions (retry, go home)
4. ✅ Use consistent design (shadcn/ui components)
5. ✅ Include error context (error ID, message)
6. ✅ Test error scenarios regularly
7. ✅ Create route-specific error boundaries for complex routes
8. ✅ Use EmptyState for no-data scenarios
9. ✅ Implement loading states for async operations
10. ✅ Consider accessibility (keyboard nav, screen readers)

## Production Checklist

- [ ] Remove `/test-error` route
- [ ] Configure error tracking service (Sentry, LogRocket)
- [ ] Update GitHub issues URL in error.tsx
- [ ] Test all error scenarios
- [ ] Verify error logging works
- [ ] Check mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Review error messages for clarity
- [ ] Ensure all routes have error boundaries


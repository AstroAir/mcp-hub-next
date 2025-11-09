import { Skeleton } from '@/components/ui/skeleton';

export default function DeveloperLoading() {
  return (
    <div className="container mx-auto py-12 px-4">
      {/* Hero skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}


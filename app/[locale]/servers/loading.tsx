import { Skeleton } from '@/components/ui/skeleton';

export default function ServersLoading() {
  return (
    <div className="container mx-auto py-12 px-4">
      {/* Hero skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Server list skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}


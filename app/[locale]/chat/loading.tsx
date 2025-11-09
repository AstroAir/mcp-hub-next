import { Skeleton } from '@/components/ui/skeleton';

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="p-2 space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-2">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-48" />
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Input skeleton */}
        <div className="border-t p-4">
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}


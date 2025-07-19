// frontend/app/devices/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DeviceDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-64" />
      
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
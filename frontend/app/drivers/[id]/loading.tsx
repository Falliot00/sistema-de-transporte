// frontend/app/drivers/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-64 mb-4" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
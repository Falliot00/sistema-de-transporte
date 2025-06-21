// frontend/app/drivers/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DriversLoading() {
  return (
    <div className="space-y-6">
        <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-9 w-72 mb-2" />
            <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[225px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
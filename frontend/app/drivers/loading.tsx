import { Skeleton } from "@/components/ui/skeleton";

export default function DriversLoading() {
  return (
    <div className="space-y-6">
        <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-9 w-72 mb-2" />
            <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
         <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                </div>
            ))}
        </div>
    </div>
  );
}
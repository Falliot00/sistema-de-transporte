// frontend/components/drivers/driver-card.tsx
"use client";

import { Driver } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Briefcase, User } from "lucide-react";

interface DriverCardProps {
    driver: Driver;
}

export function DriverCard({ driver }: DriverCardProps) {
    const fullName = `${driver.nombre} ${driver.apellido}`;

    return (
        <Link href={`/drivers/${driver.choferes_id}`} className="block group">
            <Card className="h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary">
                <CardHeader className="items-center text-center p-4">
                    <Avatar className="h-24 w-24 mb-3 border-2 border-muted">
                        <AvatarImage src={driver.foto || ""} alt={fullName} className="object-cover" />
                        <AvatarFallback className="text-3xl bg-secondary">
                            {driver.nombre.charAt(0)}{driver.apellido.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg leading-tight">{fullName}</h3>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 border-t pt-2">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{driver.empresa || "Sin empresa"}</span>
                    </div>
                     <div className="flex items-center justify-center gap-2 mt-1">
                        <User className="h-3.5 w-3.5" />
                        <span>DNI: {driver.dni || "N/A"}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
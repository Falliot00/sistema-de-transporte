"use client";

import { Driver } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Briefcase, User } from "lucide-react";

interface DriverCardProps {
    driver: Driver;
}

export function DriverCard({ driver }: DriverCardProps) {
    const fullName = `${driver.nombre} ${driver.apellido}`;

    return (
        <Link href={`/drivers/${driver.choferes_id}`} className="block group rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:border-primary/50 flex flex-col">
                <div className="relative">
                    <div className="aspect-w-1 aspect-h-1 w-full">
                         <Avatar className="h-full w-full rounded">
                            <AvatarImage src={driver.foto || ""} alt={fullName} className="object-cover" />
                            <AvatarFallback className="text-5xl bg-secondary text-secondary-foreground rounded-b-none">
                                {driver.nombre.charAt(0)}{driver.apellido.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-md leading-tight truncate">{fullName}</h3>
                       <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Briefcase className="h-3 w-3 text-amber-500" />
                          {driver.empresa || "Sin empresa"}
                      </p>
                    </div>
                </CardContent>
                <CardFooter className="p-3 text-xs bg-muted/50 border-t">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-sky-500" />
                        <span>DNI: {driver.dni || "N/A"}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
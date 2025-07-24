"use client";

import { useState, useEffect } from "react";
import { AlarmDriver, Driver } from "@/types";
import { getDrivers } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, User, UserX, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDriver: AlarmDriver | null;
  companyFilter?: string[];
  onReassign: (choferId: number | null) => void;
}

export function DriverReassignmentDialog({
  open,
  onOpenChange,
  currentDriver,
  companyFilter,
  onReassign
}: DriverReassignmentDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(currentDriver?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchDrivers();
    }
  }, [open, companyFilter]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(driver =>
        driver.apellido_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.license.includes(searchTerm)
      );
      setFilteredDrivers(filtered);
    }
  }, [drivers, searchTerm]);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDrivers({
        company: companyFilter
      });
      setDrivers(data);
      setFilteredDrivers(data);
    } catch (err) {
      setError("Error al cargar la lista de choferes");
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = () => {
    if (selectedDriverId === null) {
      onReassign(null); // Remove driver assignment
    } else {
      const driverIdNumber = parseInt(selectedDriverId);
      onReassign(driverIdNumber);
    }
  };

  const handleDriverSelect = (driverId: string | null) => {
    setSelectedDriverId(driverId);
  };

  const selectedDriver = selectedDriverId ? drivers.find(d => d.id === selectedDriverId) : null;
  const hasChanged = selectedDriverId !== currentDriver?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Reasignar Chofer
          </DialogTitle>
          <DialogDescription>
            Selecciona un chofer para asignar a esta alarma o quita la asignación actual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 min-h-0">
          {/* Current Driver */}
          {currentDriver && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Chofer Actual:</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentDriver.apellido_nombre}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  DNI: {currentDriver.license}
                </span>
              </div>
            </div>
          )}

          {/* Remove Assignment Option */}
          <div className="space-y-2">
            <button
              onClick={() => handleDriverSelect(null)}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all text-left",
                selectedDriverId === null
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                  : "border-gray-200 hover:border-red-200 hover:bg-red-50/50 dark:border-gray-700 dark:hover:border-red-700 dark:hover:bg-red-900/10"
              )}
            >
              <div className="flex items-center gap-3">
                <UserX className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">
                    Quitar asignación
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    La alarma quedará sin chofer asignado
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Drivers List */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Cargando choferes...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-500">{error}</div>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredDrivers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {searchTerm ? "No se encontraron choferes" : "No hay choferes disponibles"}
                    </div>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => handleDriverSelect(driver.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border-2 transition-all text-left",
                          selectedDriverId === driver.id
                            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                            : "border-gray-200 hover:border-green-200 hover:bg-green-50/50 dark:border-gray-700 dark:hover:border-green-700 dark:hover:bg-green-900/10"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{driver.apellido_nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              DNI: {driver.license}
                            </p>
                            {driver.company && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {driver.company}
                                </span>
                              </div>
                            )}
                          </div>
                          {currentDriver?.id === driver.id && (
                            <Badge variant="outline" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!hasChanged || loading}
            className={cn(
              selectedDriverId === null
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            )}
          >
            {selectedDriverId === null ? "Quitar Asignación" : "Asignar Chofer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
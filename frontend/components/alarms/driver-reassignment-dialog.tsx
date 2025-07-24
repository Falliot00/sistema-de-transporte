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
        (driver.dni && driver.dni.includes(searchTerm))
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

  const selectedDriver = selectedDriverId ? drivers.find(d => d.choferes_id.toString() === selectedDriverId) : null;
  const hasChanged = selectedDriverId !== currentDriver?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-md lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-[80vh] flex flex-col p-2 sm:p-4 lg:p-6 mx-2 sm:mx-4 lg:mx-0 gap-2 sm:gap-4">
        <DialogHeader className="pb-1 sm:pb-2 lg:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg">
            <User className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            Reasignar Chofer
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm leading-tight">
            Selecciona un chofer para asignar a esta alarma o quita la asignación actual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-2 sm:space-y-3 lg:space-y-4 min-h-0 overflow-hidden">
          {/* Current Driver */}
          {currentDriver && (
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg flex-shrink-0">
              <p className="text-xs font-medium mb-1">Chofer Actual:</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Badge variant="secondary" className="text-xs w-fit">
                  {currentDriver.apellido_nombre}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  DNI: {currentDriver.license}
                </span>
              </div>
            </div>
          )}

          {/* Remove Assignment Option */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleDriverSelect(null)}
              className={cn(
                "w-full p-2 rounded-lg border-2 transition-all text-left",
                selectedDriverId === null
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                  : "border-gray-200 hover:border-red-200 hover:bg-red-50/50 dark:border-gray-700 dark:hover:border-red-700 dark:hover:bg-red-900/10"
              )}
            >
              <div className="flex items-center gap-2">
                <UserX className="h-3 w-3 text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-red-700 dark:text-red-300 text-xs leading-tight">
                    Quitar asignación
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-tight">
                    Sin chofer asignado
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 text-xs h-7 sm:h-8"
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
              <ScrollArea className="h-32 sm:h-40 lg:h-56 xl:h-64">
                <div className="space-y-1 pr-2">
                  {filteredDrivers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {searchTerm ? "No se encontraron choferes" : "No hay choferes disponibles"}
                    </div>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <button
                        key={driver.choferes_id}
                        onClick={() => handleDriverSelect(driver.choferes_id.toString())}
                        className={cn(
                          "w-full p-2 rounded-lg border transition-all text-left",
                          selectedDriverId === driver.choferes_id.toString()
                            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                            : "border-gray-200 hover:border-green-200 hover:bg-green-50/50 dark:border-gray-700 dark:hover:border-green-700 dark:hover:bg-green-900/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs leading-tight truncate">{driver.apellido_nombre}</p>
                            <p className="text-xs text-muted-foreground leading-tight">
                              DNI: {driver.dni || 'N/A'}
                            </p>
                            {driver.empresa && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground truncate leading-tight">
                                  {driver.empresa}
                                </span>
                              </div>
                            )}
                          </div>
                          {currentDriver?.id === driver.choferes_id.toString() && (
                            <Badge variant="outline" className="text-xs flex-shrink-0 h-fit">
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3 border-t mt-2 sm:mt-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs h-7 sm:h-8"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!hasChanged || loading}
            className={cn(
              "w-full sm:w-auto text-xs h-7 sm:h-8",
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
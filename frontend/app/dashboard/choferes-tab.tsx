// app/dashboard/choferes-tab.tsx
"use client";

import { useState, useMemo } from 'react';
import { DriverRanking } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverRankingList } from "./driver-ranking-list";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Search } from 'lucide-react';

import { DateRange } from 'react-day-picker';
import { exportRowsToCsv } from '@/lib/csv';

interface ChoferesTabProps {
  drivers: DriverRanking[];
  dateRange?: DateRange;
}

export function ChoferesTab({ drivers, dateRange }: ChoferesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('confirmationRate_desc');

  const sortedAndFilteredDrivers = useMemo(() => {
    let filtered = drivers.filter(driver =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [key, order] = sortOrder.split('_') as [keyof DriverRanking, 'asc' | 'desc'];

    return filtered.sort((a, b) => {
      const valA = a[key] as number || 0;
      const valB = b[key] as number || 0;
      return order === 'asc' ? valA - valB : valB - valA;
    });
  }, [drivers, searchTerm, sortOrder]);

  const handleExportDrivers = () => {
    exportRowsToCsv("dashboard-choferes-ranking.csv", sortedAndFilteredDrivers, [
      { header: "ID", accessor: (driver) => driver.id },
      { header: "Chofer", accessor: (driver) => driver.name },
      { header: "Tasa Confirmacion (%)", accessor: (driver) => driver.confirmationRate },
      { header: "Alarmas Totales", accessor: (driver) => driver.totalAlarms },
      { header: "Alarmas Confirmadas", accessor: (driver) => driver.confirmedAlarms },
      { header: "Confirmadas Pendientes de Informe", accessor: (driver) => driver.confirmedNotInformedAlarms },
      { header: "Confirmadas Informadas", accessor: (driver) => driver.confirmedInformedAlarms },
      { header: "Informes Generados", accessor: (driver) => driver.generatedReports },
    ]);
  };

  if (drivers.length === 0) {
    return (
      <div className="space-y-6 mt-4">
        <h2 className="sr-only">Metricas de choferes</h2>
        <Card>
          <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Ranking y Metricas de Choferes</CardTitle>
              <CardDescription>
                {dateRange?.from && dateRange?.to
                  ? `No hay datos de choferes del ${dateRange.from.toLocaleDateString()} al ${dateRange.to.toLocaleDateString()}`
                  : 'No hay datos de choferes para mostrar.'}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-fit" disabled>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">
              {dateRange?.from
                ? 'Seleccione un rango de fechas diferente para ver las metricas de los choferes.'
                : 'Seleccione un rango de fechas para ver las metricas de los choferes.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <h2 className="sr-only">Metricas de choferes</h2>
      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Ranking y Metricas de Choferes</CardTitle>
            <CardDescription>Analisis del rendimiento de los choferes basado en las alarmas del periodo seleccionado.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportDrivers}
            disabled={sortedAndFilteredDrivers.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar chofer por nombre..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger
                className="w-full sm:w-[260px]"
                aria-label="Ordenar ranking de choferes"
              >
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmationRate_desc">Mayor Tasa Confirmacion</SelectItem>
                <SelectItem value="confirmationRate_asc">Menor Tasa Confirmacion</SelectItem>
                <SelectItem value="totalAlarms_desc">Mas Alarmas</SelectItem>
                <SelectItem value="totalAlarms_asc">Menos Alarmas</SelectItem>
                <SelectItem value="confirmedAlarms_desc">Mas Confirmadas</SelectItem>
                <SelectItem value="confirmedAlarms_asc">Menos Confirmadas</SelectItem>
                <SelectItem value="confirmedNotInformedAlarms_desc">Mas Pendientes de Informe</SelectItem>
                <SelectItem value="confirmedNotInformedAlarms_asc">Menos Pendientes de Informe</SelectItem>
                <SelectItem value="confirmedInformedAlarms_desc">Mas Confirmadas Informadas</SelectItem>
                <SelectItem value="confirmedInformedAlarms_asc">Menos Confirmadas Informadas</SelectItem>
                <SelectItem value="generatedReports_desc">Mas Informes Generados</SelectItem>
                <SelectItem value="generatedReports_asc">Menos Informes Generados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {sortedAndFilteredDrivers.length > 0 ? (
             <DriverRankingList drivers={sortedAndFilteredDrivers} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No se encontraron choferes con los filtros actuales.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

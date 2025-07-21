// app/dashboard/choferes-tab.tsx
"use client";

import { useState, useMemo } from 'react';
import { DriverRanking } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverRankingList } from "./driver-ranking-list";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

import { DateRange } from 'react-day-picker';

interface ChoferesTabProps {
  drivers: DriverRanking[];
  dateRange?: DateRange;
}

export function ChoferesTab({ drivers, dateRange }: ChoferesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('efficiencyScore_desc');

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

  if (drivers.length === 0) {
    return (
      <div className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ranking y Métricas de Choferes</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to 
                ? `No hay datos de choferes del ${dateRange.from.toLocaleDateString()} al ${dateRange.to.toLocaleDateString()}`
                : 'No hay datos de choferes para mostrar.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">
              {dateRange?.from 
                ? 'Seleccione un rango de fechas diferente para ver las métricas de los choferes.'
                : 'Seleccione un rango de fechas para ver las métricas de los choferes.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Ranking y Métricas de Choferes</CardTitle>
          <CardDescription>Análisis del rendimiento de los choferes basado en las alarmas del período seleccionado.</CardDescription>
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
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efficiencyScore_desc">Mayor Eficiencia</SelectItem>
                <SelectItem value="efficiencyScore_asc">Menor Eficiencia</SelectItem>
                <SelectItem value="totalAlarms_desc">Más Alarmas</SelectItem>
                <SelectItem value="totalAlarms_asc">Menos Alarmas</SelectItem>
                <SelectItem value="confirmationRate_desc">Mayor Tasa Confirmación</SelectItem>
                <SelectItem value="confirmationRate_asc">Menor Tasa Confirmación</SelectItem>
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
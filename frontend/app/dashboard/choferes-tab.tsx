// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/choferes-tab.tsx
"use client";

import { useState, useEffect } from 'react';
import { Driver } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverRankingList } from "./driver-ranking-list";
// REMOVIDO: import { getMockDriverRanking } from "@/lib/mock-data";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export function ChoferesTab() {
  // CAMBIO: Inicializa drivers como un array vacío
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('efficiencyScore_desc');

  useEffect(() => {
    // CAMBIO: No cargar datos mock aquí.
    setDrivers([]); 
  }, []);

  const handleSort = (criteria: string) => {
    setSortOrder(criteria);
    const [key, order] = criteria.split('_') as [keyof Driver, 'asc' | 'desc'];
    
    // CAMBIO: Asegurarse de ordenar solo si hay datos.
    const sortedDrivers = [...filteredDrivers].sort((a, b) => { // Ordenar sobre los ya filtrados para la UI
      const valA = (a as any)[key] || 0; // Casteo a any para acceder a propiedades dinámicamente
      const valB = (b as any)[key] || 0;
      if (order === 'asc') {
        return valA - valB;
      }
      return valB - valA;
    });
    setDrivers(sortedDrivers);
  };
  
  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Ranking y Métricas de Choferes</CardTitle>
          <CardDescription>Análisis del rendimiento de los choferes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar chofer por nombre o licencia..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortOrder} onValueChange={handleSort}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efficiencyScore_desc">Mayor Eficiencia</SelectItem>
                <SelectItem value="efficiencyScore_asc">Menor Eficiencia</SelectItem>
                <SelectItem value="totalAlarms_desc">Más Alarmas</SelectItem>
                <SelectItem value="totalAlarms_asc">Menos Alarmas</SelectItem>
                <SelectItem value="confirmationRate_desc">Mayor Confirmación</SelectItem>
                <SelectItem value="confirmationRate_asc">Menor Confirmación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredDrivers.length > 0 ? (
             <DriverRankingList drivers={filteredDrivers} />
          ) : (
            <p className="text-center text-muted-foreground py-4">No se encontraron choferes con los filtros actuales.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
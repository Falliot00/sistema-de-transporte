// frontend/components/ui/pagination-controls.tsx
'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from './button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null; // No mostrar controles si solo hay una página o menos.
  }

  return (
    <Pagination>
      <PaginationContent className="flex items-center justify-center w-full">
        <PaginationItem>
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Ir a la página anterior"
            // Clases añadidas para alineación, espaciado y tamaño uniforme
            className="flex items-center justify-center gap-1.5 min-w-[100px] sm:min-w-[120px] px-3 sm:px-4 py-2"
          >
            {/* Icono de flecha antes del texto para "Anterior" */}
            {/*<PaginationPrevious className="h-4 w-4" />*/}
            <span className="hidden sm:inline">Anterior</span>
          </Button>
        </PaginationItem>

        <PaginationItem className="hidden sm:flex items-center text-sm text-muted-foreground mx-4">
          Página {currentPage} de {totalPages}
        </PaginationItem>

        <PaginationItem>
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Ir a la página siguiente"
            // Clases añadidas para alineación, espaciado y tamaño uniforme
            className="flex items-center justify-center gap-1.5 min-w-[100px] sm:min-w-[120px] px-3 sm:px-4 py-2"
          >
            {/* Texto antes del icono de flecha para "Siguiente" */}
            <span className="hidden sm:inline">Siguiente</span>
            {/*<PaginationNext className="h-4 w-4" />*/}
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
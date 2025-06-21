// frontend/components/ui/progress.tsx
'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

// --- INICIO DE LA SOLUCIÓN ---
// 1. Exportamos una interfaz de Props extendida para incluir nuestra nueva propiedad.
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps // 2. Usamos nuestra interfaz de Props extendida.
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      // 3. Aplicamos la clase personalizada al indicador, manteniendo las clases base.
      className={cn(
        'h-full w-full flex-1 bg-primary transition-all',
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
// --- FIN DE LA SOLUCIÓN ---

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
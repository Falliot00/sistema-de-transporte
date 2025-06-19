// frontend/components/ui/visually-hidden.tsx
'use client';

import * as React from 'react';
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden'; // Radix UI Visually Hidden Primitive

import { cn } from '@/lib/utils'; // Assuming cn utility is available for class merging

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ className, ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName;

export { VisuallyHidden };
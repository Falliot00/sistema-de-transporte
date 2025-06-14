import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success:
          "border-transparent bg-green-600 text-primary-foreground hover:bg-green-600/80",
        warning:
          "border-transparent bg-yellow-500 text-secondary-foreground hover:bg-yellow-500/80",
        
        // Paleta de Fallback (colores más suaves)
        sky: "border-transparent bg-sky-100 text-sky-800 hover:bg-sky-100/80 dark:bg-sky-900/50 dark:text-sky-200",
        emerald: "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-900/50 dark:text-emerald-200",
        amber: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80 dark:bg-amber-900/50 dark:text-amber-200",
        
        // --- INICIO DE LA SOLUCIÓN: Paleta de colores fuertes solicitada ---
        brown: "border-transparent bg-amber-800 text-amber-50 hover:bg-amber-800/80 dark:bg-amber-900 dark:text-amber-200", // Para RGB(120, 66, 18)
        deepBlue: "border-transparent bg-indigo-800 text-indigo-50 hover:bg-indigo-800/80 dark:bg-indigo-900 dark:text-indigo-100", // Para azul(rgb(55 48 163))
        deepViolet: "border-transparent bg-fuchsia-800 text-fuchsia-50 hover:bg-fuchsia-800/80 dark:bg-fuchsia-900 dark:text-fuchsia-100", // Para violeta(rgb(134 25 143))
        darkRed: "border-transparent bg-red-900 text-red-50 hover:bg-red-900/80 dark:bg-red-950 dark:text-red-100", // Para RGB(84, 7, 11)
        orangeBlack: "border-transparent bg-[#6e551c] text-amber-50 hover:bg-[#6e551c]/80 dark:bg-[#4a3913] dark:text-amber-200",
        // Otras variantes fuertes que ya teníamos
        purple: "border-transparent bg-purple-600 text-purple-50 hover:bg-purple-600/80 dark:bg-purple-800 dark:text-purple-100",
        tealDark: "border-transparent bg-teal-600 text-teal-50 hover:bg-teal-600/80 dark:bg-teal-800 dark:text-teal-100",
        rose: "border-transparent bg-rose-600 text-rose-50 hover:bg-rose-600/80 dark:bg-rose-800 dark:text-rose-100",
        // --- FIN DE LA SOLUCIÓN ---
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
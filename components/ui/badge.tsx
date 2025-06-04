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
        success: 
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        warning: 
          "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        danger: 
          "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        info: 
          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        purple: 
          "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
        orange: 
          "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
        indigo: 
          "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
        pink: 
          "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
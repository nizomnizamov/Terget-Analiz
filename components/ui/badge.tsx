import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      danger: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
      neutral: "bg-muted text-muted-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

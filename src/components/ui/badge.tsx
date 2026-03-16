import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary border border-primary/20',
        secondary:   'bg-secondary text-secondary-foreground border border-border',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        success:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        outline:     'border border-border text-foreground',
        muted:       'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

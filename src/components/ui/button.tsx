import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-orange-600 hover:shadow-[0_4px_12px_rgba(249,115,22,0.35)] hover:-translate-y-px',
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive/15',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:-translate-y-px shadow-sm',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        link:
          'text-primary underline-offset-4 hover:underline',
        success:
          'bg-success text-success-foreground hover:bg-emerald-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-px',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-12 px-6 text-base font-bold rounded-lg',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

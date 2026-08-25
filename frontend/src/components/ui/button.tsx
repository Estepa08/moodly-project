import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-[color,background-color,opacity,transform,box-shadow,border-color] duration-150 ease-settle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-btn-gradient text-primary-foreground shadow-neumorphic-sm hover:shadow-neumorphic hover:brightness-105',
        secondary:
          'bg-secondary text-secondary-foreground border border-primary/20 shadow-neumorphic-sm hover:shadow-neumorphic',
        ghost: 'text-foreground hover:bg-secondary hover:text-primary',
        outline:
          'border border-primary/70 bg-card text-foreground shadow-neumorphic-sm hover:shadow-neumorphic hover:border-primary/70',
        destructive:
          'bg-destructive text-destructive-foreground shadow-neumorphic-sm hover:shadow-neumorphic hover:brightness-105',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 [&>svg]:w-4 [&>svg]:h-4',
        sm: 'h-8 px-3 text-xs [&>svg]:w-4 [&>svg]:h-4',
        lg: 'h-11 px-8 text-base [&>svg]:w-5 [&>svg]:h-5',
        icon: 'h-10 w-10 [&>svg]:w-4 [&>svg]:h-4',
        'icon-sm': 'h-8 w-8 [&>svg]:w-4 [&>svg]:h-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

/* eslint-disable-next-line react-refresh/only-export-components */
export { Button, buttonVariants };

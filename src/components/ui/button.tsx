import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium persian-text transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md',
        secondary:
          'bg-secondary-500 text-white hover:bg-secondary-600 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md',
        outline:
          'border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 hover:scale-[1.02] active:scale-[0.98]',
        ghost:
          'text-primary-500 bg-transparent hover:bg-primary-50 hover:text-primary-600 active:scale-[0.98]',
        danger:
          'bg-error-500 text-white hover:bg-error-600 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md',
        success:
          'bg-success-500 text-white hover:bg-success-600 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md',
        warning:
          'bg-warning-500 text-white hover:bg-warning-600 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        xl: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: 'left' | 'right' | 'only';
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && (
          icon === 'left' ? (
            <span className="flex items-center gap-2">{children}</span>
          ) : icon === 'right' ? (
            <span className="flex items-center gap-2 flex-row-reverse">
              {children}
            </span>
          ) : (
            children
          )
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 persian-text',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary:
          'border-transparent bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        success:
          'border-transparent bg-success-100 text-success-800 hover:bg-success-200',
        warning:
          'border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200',
        error:
          'border-transparent bg-error-100 text-error-800 hover:bg-error-200',
        outline:
          'border-border-medium text-text-primary hover:bg-background-secondary',
        ghost:
          'border-transparent bg-transparent text-text-primary hover:bg-background-secondary',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    { className, variant, size, icon, removable, onRemove, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="حذف"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };

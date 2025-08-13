import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 persian-text',
  {
    variants: {
      variant: {
        default:
          'border-border-light bg-white hover:border-border-medium focus:border-primary-500',
        filled:
          'border-transparent bg-background-secondary hover:bg-background-tertiary focus:bg-white focus:border-primary-500',
        outlined:
          'border-2 border-primary-200 bg-transparent hover:border-primary-300 focus:border-primary-500',
        ghost:
          'border-transparent bg-transparent hover:bg-background-secondary focus:bg-white focus:border-primary-500',
      },
      size: {
        sm: 'h-9 px-3 py-2 text-sm',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
        xl: 'h-14 px-5 py-4 text-lg',
      },
      state: {
        default: '',
        error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
        success:
          'border-success-500 focus:border-success-500 focus:ring-success-500',
        warning:
          'border-warning-500 focus:border-warning-500 focus:ring-warning-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRTL?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      size,
      state,
      label,
      helperText,
      errorText,
      leftIcon,
      rightIcon,
      isRTL = true,
      ...props
    },
    ref
  ) => {
    const inputState = errorText ? 'error' : state;

    return (
      <div className={cn('w-full', isRTL && 'text-right')}>
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2 persian-body">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute top-1/2 transform -translate-y-1/2 text-text-tertiary',
                isRTL ? 'right-3' : 'left-3'
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size, state: inputState }),
              leftIcon && (isRTL ? 'pr-10' : 'pl-10'),
              rightIcon && (isRTL ? 'pl-10' : 'pr-10'),
              isRTL && 'text-right dir-rtl',
              className
            )}
            ref={ref}
            dir={isRTL ? 'rtl' : 'ltr'}
            {...props}
          />
          {rightIcon && (
            <div
              className={cn(
                'absolute top-1/2 transform -translate-y-1/2 text-text-tertiary',
                isRTL ? 'left-3' : 'right-3'
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || errorText) && (
          <p
            className={cn(
              'mt-2 text-xs persian-body',
              errorText ? 'text-error-600' : 'text-text-secondary'
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };

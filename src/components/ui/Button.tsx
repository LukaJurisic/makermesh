import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {cn} from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border px-4 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:pointer-events-none disabled:opacity-45 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--terracotta-contrast)] bg-[var(--terracotta-contrast)] text-white hover:border-[#8f432e] hover:bg-[#8f432e]',
        secondary:
          'border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--ink)] hover:border-[var(--ink-soft)]',
        quiet:
          'border-transparent bg-transparent text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
        dark: 'border-white/20 bg-white text-[var(--ink)] hover:bg-[#eee9df]',
        danger:
          'border-[var(--danger)] bg-transparent text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white',
      },
      size: {
        sm: 'min-h-9 px-3 text-xs',
        md: 'min-h-11 px-4',
        lg: 'min-h-12 px-5 text-[15px]',
        icon: 'size-11 min-h-11 p-0',
      },
    },
    defaultVariants: {variant: 'primary', size: 'md'},
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({asChild, className, size, variant, ...props}, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component className={cn(buttonVariants({size, variant}), className)} ref={ref} {...props} />
    );
  },
);

Button.displayName = 'Button';

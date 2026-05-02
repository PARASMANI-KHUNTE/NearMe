import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const variantsMap = {
      primary: 'bg-[var(--primary)] text-white hover:brightness-110 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/30',
      secondary: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--primary)]',
      ghost: 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
      danger: 'bg-[var(--error)] text-white hover:brightness-110 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-error/30',
      glass: 'glass text-[var(--text)] hover:brightness-125 hover:-translate-y-0.5 active:scale-95',
    };

    return (
      <button
        ref={ref}
        className={`
          ${sizes[size]}
          rounded-xl font-semibold transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]
          inline-flex items-center justify-center gap-2 whitespace-nowrap
          ${variantsMap[variant]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

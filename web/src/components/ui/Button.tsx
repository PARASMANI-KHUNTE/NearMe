import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5',
      lg: 'px-6 py-3 text-lg',
    };
    
    const variantsMap = {
      primary: 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)]',
      ghost: 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
      danger: 'bg-[var(--error)] text-white hover:opacity-90',
      glass: 'glass text-[var(--text)] hover:opacity-90',
    };

    return (
      <button
        ref={ref}
        className={`
          ${sizes[size]} 
          rounded-xl font-medium transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed 
          inline-flex items-center justify-center gap-2
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
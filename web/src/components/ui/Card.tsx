import { forwardRef, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl p-6 md:p-8 transition-all duration-300';

    const variants = {
      default: 'bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--border)] hover:border-[var(--primary)]/50',
      glass: 'glass hover:border-[var(--primary)]/30',
    };

    const hoverStyles = 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer';

    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${hover ? hoverStyles : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

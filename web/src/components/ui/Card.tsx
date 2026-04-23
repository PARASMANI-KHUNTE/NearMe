import { forwardRef, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl p-6 transition-all duration-200';
    
    const variants = {
      default: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]',
      glass: 'glass',
    };

    const hoverStyles = 'hover:translate-y-[-2px] hover:shadow-lg cursor-pointer';

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
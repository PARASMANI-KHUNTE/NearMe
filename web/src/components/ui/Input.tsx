import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-2xl
            bg-[var(--surface)] border-2 ${error ? 'border-[var(--error)]' : 'border-[var(--border)]'}
            text-[var(--text)] placeholder-[var(--text-muted)]
            focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm font-semibold text-[var(--error)] flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

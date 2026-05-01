import type { CSSProperties, HTMLAttributes } from 'react';

type NearMeLogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  stacked?: boolean;
  style?: CSSProperties;
};

const sizeMap = {
  sm: {
    mark: 'h-9 w-9',
    innerRing: 'h-5 w-5 border-2',
    outerRing: 'h-9 w-9',
    dot: 'h-2.5 w-2.5',
    title: 'text-lg',
    subtitle: 'text-[10px]',
  },
  md: {
    mark: 'h-11 w-11',
    innerRing: 'h-6 w-6 border-[2.5px]',
    outerRing: 'h-11 w-11',
    dot: 'h-3 w-3',
    title: 'text-xl',
    subtitle: 'text-[11px]',
  },
  lg: {
    mark: 'h-16 w-16',
    innerRing: 'h-8 w-8 border-[3px]',
    outerRing: 'h-16 w-16',
    dot: 'h-4 w-4',
    title: 'text-3xl',
    subtitle: 'text-xs',
  },
} as const;

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function NearMeLogo({
  size = 'md',
  showWordmark = true,
  stacked = false,
  className,
  style,
  ...props
}: NearMeLogoProps) {
  const styles = sizeMap[size];

  return (
    <div
      className={joinClasses(
        'inline-flex items-center gap-3 text-[var(--text)]',
        stacked && 'flex-col gap-4 text-center',
        className,
      )}
      style={style}
      {...props}
    >
      <div
        className={joinClasses(
          'relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/20',
          'bg-[linear-gradient(135deg,#f97316_0%,#f59e0b_48%,#facc15_100%)] shadow-[0_16px_40px_-18px_rgba(249,115,22,0.95)]',
          styles.mark,
        )}
      >
        <div className="absolute inset-[2px] rounded-[14px] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.3),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
        <div className="relative flex items-center justify-center">
          <div className={joinClasses('rounded-full border-white/95', styles.innerRing)} />
          <div className={joinClasses('absolute rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.72)]', styles.dot)} />
          <div className={joinClasses('absolute rounded-full border border-white/20', styles.outerRing)} />
        </div>
      </div>

      {showWordmark && (
        <div className={joinClasses('min-w-0', stacked && 'flex flex-col items-center')}>
          <div className={joinClasses('font-black uppercase leading-none tracking-[0.08em]', styles.title)}>
            NearMe
          </div>
          <div className={joinClasses('mt-1 font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]', styles.subtitle)}>
            proximity network
          </div>
        </div>
      )}
    </div>
  );
}

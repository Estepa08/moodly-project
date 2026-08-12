import { cn } from '../../lib/utils';

interface ProgressBarSegment {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

interface ProgressBarProps {
  segments: ProgressBarSegment[];
  height?: number;
  rounded?: boolean;
  trackClassName?: string;
  className?: string;
}

export function ProgressBar({
  segments,
  height = 2,
  rounded = true,
  trackClassName,
  className,
}: ProgressBarProps) {
  return (
    <div
      className={cn(
        'flex overflow-hidden shadow-neumorphic-inset bg-muted',
        rounded && 'rounded-full',
        trackClassName,
        className,
      )}
      style={{ height: `${height * 4}px` }}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn('h-full transition-[width] duration-150', seg.className)}
          style={{ width: `${seg.value}%`, ...seg.style }}
        />
      ))}
    </div>
  );
}

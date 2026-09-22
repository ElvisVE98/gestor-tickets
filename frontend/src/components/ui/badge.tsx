import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'navy';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default:
      'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary:
      'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive:
      'border-transparent bg-red-100 text-red-800 border border-red-200 hover:bg-red-200/80',
    outline: 'text-foreground border border-slate-300',
    success:
      'border-transparent bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200/80',
    warning:
      'border-transparent bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200/80',
    info: 'border-transparent bg-sky-100 text-sky-800 border border-sky-200 hover:bg-sky-200/80',
    navy: 'border-transparent bg-[#1a2b5c] text-white hover:bg-[#243b7d]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

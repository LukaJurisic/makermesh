import type {SVGProps} from 'react';
import {Link} from 'react-router-dom';
import {cn} from '@/lib/cn';

export function LogoMark({className, ...props}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn('size-9', className)}
      {...props}
    >
      <path
        d="M6 9 13 30 20 17 27 30 34 9M6 9l14 8 14-8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="9" r="2.5" fill="var(--terracotta)" />
      <circle cx="13" cy="30" r="2.5" fill="currentColor" />
      <circle cx="20" cy="17" r="2.5" fill="var(--teal)" />
      <circle cx="27" cy="30" r="2.5" fill="currentColor" />
      <circle cx="34" cy="9" r="2.5" fill="var(--ochre)" />
    </svg>
  );
}

export function Brand({inverse = false, compact = false}: {inverse?: boolean; compact?: boolean}) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
        inverse ? 'text-white' : 'text-[var(--ink)]',
      )}
      aria-label="MakerMesh home"
    >
      <LogoMark />
      {!compact && <span className="text-[18px] font-semibold tracking-[-0.035em]">MakerMesh</span>}
    </Link>
  );
}

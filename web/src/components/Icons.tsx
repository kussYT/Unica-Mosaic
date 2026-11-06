type IconProps = {
  className?: string
}

function Mark({
  className,
  d,
  viewBox = '0 0 24 24',
  star = false,
}: IconProps & { d: string; viewBox?: string; star?: boolean }) {
  return (
    <svg className={className ?? (star ? 'icon-star' : 'icon-arrow')} viewBox={viewBox} aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={star ? 1.7 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowNorthEast({ className }: IconProps) {
  return <Mark className={className} viewBox="6 6 12 12" d="M7 17 17 7M17 7H10M17 7v7" />
}

export function ArrowRight({ className }: IconProps) {
  return <Mark className={className} viewBox="4 4 16 16" d="M5 12h14M12 6l7 6-7 6" />
}

export function ArrowLeft({ className }: IconProps) {
  return <Mark className={className} viewBox="4 4 16 16" d="M19 12H5M12 6 5 12l7 6" />
}

export function ArrowDown({ className }: IconProps) {
  return <Mark className={className} viewBox="4 4 16 16" d="M12 5v14M6 12l6 7 6-7" />
}

export function Asterisk({ className }: IconProps) {
  return <Mark className={className} star d="M12 2.6v18.8M2.6 12h18.8M5.2 5.2l13.6 13.6M18.8 5.2 5.2 18.8" />
}

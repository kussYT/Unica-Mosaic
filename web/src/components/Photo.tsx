type PhotoProps = {
  name: string
  alt: string
  className?: string
  eager?: boolean
  sizes?: string
}

export function Photo({
  name,
  alt,
  className,
  eager = false,
  sizes = '(max-width: 700px) 100vw, 50vw',
}: PhotoProps) {
  return (
    <img
      className={className}
      src={`/images/${name}-960.webp`}
      srcSet={`/images/${name}-480.webp 480w, /images/${name}-960.webp 960w, /images/${name}-1600.webp 1600w`}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      width={960}
      height={1280}
    />
  )
}

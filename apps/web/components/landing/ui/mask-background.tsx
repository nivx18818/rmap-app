export function MaskBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage:
          'linear-gradient(100deg, rgba(125, 211, 252, 0.1) 0%, rgba(165, 180, 252, 0.1) 50%, rgba(249, 168, 212, 0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent)',
        maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
      }}
      aria-hidden="true"
    />
  );
}

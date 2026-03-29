interface CategoryLabelProps {
  label: string;
}

export function CategoryLabel({ label }: CategoryLabelProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="flex items-center rounded-full border border-violet-500/15 px-5 py-1.5"
        style={{
          backgroundImage: 'var(--color-gradient-category-pill)',
        }}
      >
        <span className="text-sm leading-5 font-medium whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}

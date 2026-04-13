interface CategoryLabelProps {
  label: string;
}

export function CategoryLabel({ label }: CategoryLabelProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="category-pill-shell flex items-center rounded-full px-5 py-1.5">
        <span className="text-sm leading-5 font-medium whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}

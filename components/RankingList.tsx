export default function RankingList({
  items,
  formatValue,
}: {
  items: { label: string; value: number; sub?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-medium text-text-primary">
              {formatValue ? formatValue(item.value) : item.value}
              {item.sub && <span className="text-text-muted font-normal"> · {item.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-[12px] text-text-muted">Aucune donnée.</p>}
    </div>
  );
}
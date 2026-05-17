interface PersonLabelProps {
  name: string;
  steamId: string;
  className?: string;
}

export function PersonLabel({ name, steamId, className }: PersonLabelProps) {
  const trimmed = name.trim();
  if (!trimmed || trimmed === steamId) {
    return <span className={className}>{steamId}</span>;
  }
  return (
    <span className={className}>
      {trimmed}{" "}
      <span className="text-[var(--steam-id)]">({steamId})</span>
    </span>
  );
}

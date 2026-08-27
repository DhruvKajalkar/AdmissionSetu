interface StatCardProps {
  label: string;
  value: string;
  supportingText?: string;
}

export function StatCard({ label, value, supportingText }: StatCardProps) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {supportingText ? <small>{supportingText}</small> : null}
    </article>
  );
}

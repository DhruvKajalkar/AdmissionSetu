export function formatPercentile(value: number): string {
  return value.toFixed(2);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatShortDeadline(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function formatTimeRemaining(deadline: string, now: string): string {
  const remainingMilliseconds = new Date(deadline).getTime() - new Date(now).getTime();
  if (remainingMilliseconds <= 0) return "Deadline passed";

  const hours = Math.ceil(remainingMilliseconds / (1000 * 60 * 60));
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} remaining`;

  const days = Math.ceil(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} remaining`;
}

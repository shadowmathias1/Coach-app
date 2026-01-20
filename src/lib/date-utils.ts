/**
 * Get the start date of the current week (Monday) in ISO format (YYYY-MM-DD)
 */
export function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)
  );
  return weekStart.toISOString().split('T')[0];
}

/**
 * Get the start date of a date range (N days ago) in ISO format
 */
export function getRangeStartDate(daysAgo: number = 7): string {
  const now = new Date();
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysAgo
    )
  );
  return start.toISOString().split('T')[0];
}

/**
 * Calculate week number from a start date
 */
export function getWeekNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 1;
}

import { CleanupSchedule } from './library.dto.js';

export const CLEANUP_HOUR = 4;

/** Whether the schedule has a cleanup on the day of the date */
export function isCleanupDay(date: Date, schedule: CleanupSchedule): boolean {
  switch (schedule) {
    case CleanupSchedule.Daily:
      return true;
    case CleanupSchedule.Weekly:
      return date.getDay() === 1;
    case CleanupSchedule.Monthly:
      return date.getDate() === 1;
    case CleanupSchedule.Off:
      return false;
  }
}

/** When the next cleanup runs, in the time zone of the server */
export function getNextCleanup(
  now: Date,
  schedule: CleanupSchedule,
): Date | undefined {
  if (schedule === CleanupSchedule.Off) return undefined;

  const next = new Date(now);
  next.setHours(CLEANUP_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  while (!isCleanupDay(next, schedule)) next.setDate(next.getDate() + 1);

  return next;
}

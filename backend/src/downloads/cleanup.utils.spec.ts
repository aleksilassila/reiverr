import { getNextCleanup, isCleanupDay } from './cleanup.utils.js';
import { CleanupSchedule } from './downloads.dto.js';

// The 5th of October 2026 is a Monday
const october = (day: number, hour = 12) => new Date(2026, 9, day, hour);

describe('cleanup schedule', () => {
  it('has a cleanup every day, on Mondays or on the first of the month', () => {
    const days = (schedule: CleanupSchedule) =>
      [1, 4, 5, 6].filter((day) => isCleanupDay(october(day), schedule));

    expect(days(CleanupSchedule.Daily)).toEqual([1, 4, 5, 6]);
    expect(days(CleanupSchedule.Weekly)).toEqual([5]);
    expect(days(CleanupSchedule.Monthly)).toEqual([1]);
    expect(days(CleanupSchedule.Off)).toEqual([]);
  });

  it('finds the next cleanup, at 4 in the morning', () => {
    expect(getNextCleanup(october(5, 3), CleanupSchedule.Daily)).toEqual(
      october(5, 4),
    );
    expect(getNextCleanup(october(5, 4), CleanupSchedule.Daily)).toEqual(
      october(6, 4),
    );

    expect(getNextCleanup(october(4), CleanupSchedule.Weekly)).toEqual(
      october(5, 4),
    );
    expect(getNextCleanup(october(5), CleanupSchedule.Weekly)).toEqual(
      october(12, 4),
    );

    expect(getNextCleanup(october(1, 3), CleanupSchedule.Monthly)).toEqual(
      october(1, 4),
    );
    expect(getNextCleanup(october(5), CleanupSchedule.Monthly)).toEqual(
      new Date(2026, 10, 1, 4),
    );

    expect(getNextCleanup(october(5), CleanupSchedule.Off)).toBeUndefined();
  });
});

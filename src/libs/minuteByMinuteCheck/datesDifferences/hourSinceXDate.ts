import { differenceInHours } from 'date-fns';

export const hoursSinceXDate = (date: Date) => {
  const now = new Date();

  const hoursDiff = differenceInHours(date, now);

  return Math.abs(hoursDiff);
};

import { differenceInMinutes } from 'date-fns';

export const minutesSinceXDate = (date: Date) => {
  const now = new Date();

  const minuteDiff = differenceInMinutes(date, now);

  return Math.abs(minuteDiff);
};

import { differenceInMinutes } from 'date-fns';

export const minutesSinceXDate = (date: Date) => {
  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  const minuteDiff = differenceInMinutes(date, today);

  return Math.abs(minuteDiff);
};

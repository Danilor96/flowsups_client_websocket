import { differenceInDays } from 'date-fns';

export const daysSinceXDate = (date: Date) => {
  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  const daysDiff = differenceInDays(date, today);

  return Math.abs(daysDiff);
};

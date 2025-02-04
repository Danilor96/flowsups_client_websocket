import { differenceInHours } from 'date-fns';

export const hoursSinceXDate = (date: Date) => {
  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  const hoursDiff = differenceInHours(date, today);

  return Math.abs(hoursDiff);
};

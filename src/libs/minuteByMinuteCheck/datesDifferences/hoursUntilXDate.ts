import { differenceInHours } from 'date-fns';

export const hoursUntilXDate = (date: Date) => {
  const todayIsos = new Date().toISOString();

  const today = new Date(todayIsos);

  const hoursDiff = differenceInHours(today, date);

  return hoursDiff;
};

import { differenceInHours } from 'date-fns';

export const hoursUntilXDate = (date: Date) => {
  const now = new Date();

  const hoursDiff = differenceInHours(now, date);

  return hoursDiff;
};

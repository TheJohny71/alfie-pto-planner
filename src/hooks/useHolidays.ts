import { useState, useEffect } from 'react';
import type { Region, Holiday } from '../types';
import { calculateHolidays } from '../utils/holidayCalculator';

export const useHolidays = (region: Region) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        // Use your existing holidayCalculator utility
        const holidayList = await calculateHolidays(region);
        setHolidays(holidayList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch holidays'));
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [region]);

  return {
    holidays,
    loading,
    error
  };
};

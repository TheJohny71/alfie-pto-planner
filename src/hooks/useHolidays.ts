import { useState, useEffect } from 'react';
import { Holiday } from '../types';

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Your existing holiday loading logic
    setLoading(false);
  }, []);

  return { holidays, loading, error };
};

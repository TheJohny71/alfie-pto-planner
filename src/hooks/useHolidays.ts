import { useState, useEffect } from 'react';
import type { Holiday, Region } from '../types';

// Sample holiday data - replace with actual API call later
const SAMPLE_HOLIDAYS: Holiday[] = [
  {
    date: '2024-01-01',
    name: "New Year's Day",
    region: 'both'
  },
  {
    date: '2024-12-25',
    name: 'Christmas Day',
    region: 'both'
  },
  {
    date: '2024-07-04',
    name: 'Independence Day',
    region: 'US'
  },
  {
    date: '2024-08-26',
    name: 'Summer Bank Holiday',
    region: 'UK'
  }
];

export function useHolidays(selectedRegion: Region = 'both') {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter holidays based on selected region
        const filteredHolidays = SAMPLE_HOLIDAYS.filter(holiday => 
          holiday.region === 'both' || holiday.region === selectedRegion
        );
        
        setHolidays(filteredHolidays);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch holidays'));
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [selectedRegion]);

  return {
    holidays,
    loading,
    error,
    refreshHolidays: () => setHolidays([...SAMPLE_HOLIDAYS])
  };
}

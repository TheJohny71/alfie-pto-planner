import { useState, useEffect } from 'react';
import type { TeamAvailability } from '../types';
import { getStorageService } from '../utils/storage';

export const useTeamAvailability = (currentDate: Date) => {
  const [teamAvailability, setTeamAvailability] = useState<TeamAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTeamAvailability = async () => {
      try {
        setLoading(true);
        const storage = getStorageService();
        
        // Get the start and end of the month
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Use your existing storage service to fetch PTO requests
        const ptoRequests = await storage.getPTORequests(startDate, endDate);
        const teamMembers = await storage.getTeamMembers();
        
        // Calculate availability for each day
        const availability: TeamAvailability[] = [];
        let currentDay = new Date(startDate);
        
        while (currentDay <= endDate) {
          const awayMembers = teamMembers.filter(member =>
            ptoRequests.some(request =>
              request.userId === member.id &&
              request.status === 'approved' &&
              new Date(request.startDate) <= currentDay &&
              new Date(request.endDate) >= currentDay
            )
          );
          
          const availableMembers = teamMembers.filter(
            member => !awayMembers.some(away => away.id === member.id)
          );
          
          availability.push({
            date: new Date(currentDay),
            availableMembers,
            awayMembers
          });
          
          currentDay.setDate(currentDay.getDate() + 1);
        }
        
        setTeamAvailability(availability);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch team availability'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAvailability();
  }, [currentDate]);

  return {
    teamAvailability,
    loading,
    error
  };
};

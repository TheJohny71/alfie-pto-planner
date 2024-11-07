import Swal from 'sweetalert2';
import { Holiday } from '../types/holidays';

export const showHolidayConfirmation = async (holiday: Holiday, leaveType: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: 'Holiday Notice',
    text: `${holiday.date} is ${holiday.name}. Do you still want to request ${leaveType}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33'
  });

  return result.isConfirmed;
};

export const showError = (message: string): void => {
  Swal.fire({
    title: 'Error',
    text: message,
    icon: 'error',
    confirmButtonText: 'OK'
  });
};

export const showSuccess = (message: string): void => {
  Swal.fire({
    title: 'Success',
    text: message,
    icon: 'success',
    confirmButtonText: 'OK'
  });
};

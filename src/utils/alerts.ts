// At the top of your file
import Swal from 'sweetalert2';

export const showAlert = () => {
    // Your alert code
}
// Try this simpler import first
import Swal from 'sweetalert2';
import { Holiday } from '../types/holidays';

// If the above doesn't work, try this alternative:
// const Swal = require('sweetalert2');

export const showHolidayConfirmation = async (holiday: Holiday, leaveType: string): Promise<boolean> => {
  try {
    const result = await Swal.fire({
      title: 'Holiday Notice',
      text: `${holiday.date} is ${holiday.name}. Do you still want to request ${leaveType}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });

    return result.isConfirmed;
  } catch (error) {
    console.error('SweetAlert error:', error);
    return false;
  }
};

export const showError = (message: string): void => {
  try {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error'
    });
  } catch (error) {
    console.error('SweetAlert error:', error);
    alert(message); // Fallback to regular alert
  }
};

export const showSuccess = (message: string): void => {
  try {
    Swal.fire({
      title: 'Success',
      text: message,
      icon: 'success'
    });
  } catch (error) {
    console.error('SweetAlert error:', error);
    alert(message); // Fallback to regular alert
  }
};

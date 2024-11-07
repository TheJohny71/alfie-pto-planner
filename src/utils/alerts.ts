// src/utils/alerts.ts

declare const Swal: any;

export const showSuccess = (message: string) => {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
};

export const showError = (message: string) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
};

export const showConfirm = async (message: string) => {
    const result = await Swal.fire({
        icon: 'question',
        title: 'Confirm',
        text: message,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    });
    return result.isConfirmed;
};

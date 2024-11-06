// Error handling functions
function handleError(error) {
    console.error('An error occurred:', error);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An unexpected error occurred'
    });
}

export { handleError };

// errors.js
export const handleError = (message, error) => {
    console.error(message, error);
    
    // Display error to user
    const errorContainer = document.getElementById('error-container');
    const errorDetails = document.getElementById('error-details');
    
    if (errorContainer && errorDetails) {
        errorDetails.textContent = `${message}: ${error.message || 'Unknown error'}`;
        errorContainer.style.display = 'block';
    }
};

export default {
    handleError
};

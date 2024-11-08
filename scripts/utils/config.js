// config.js
export const config = {
    appName: 'PTO Calendar',
    version: '1.0.0',
    defaultRegion: 'US',
    dateFormat: 'YYYY-MM-DD',
    maxPTODays: 25,
    regions: {
        US: {
            workDays: [1, 2, 3, 4, 5], // Monday to Friday
            weekendDays: [0, 6] // Sunday, Saturday
        },
        UK: {
            workDays: [1, 2, 3, 4, 5],
            weekendDays: [0, 6]
        }
    }
};

export default config;

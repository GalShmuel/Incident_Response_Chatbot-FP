// Get the user's preferred date format from localStorage
export const getDateFormat = () => {
    return localStorage.getItem('dateFormat') || 'MM/DD/YYYY';
};

// Get the user's preferred timezone from localStorage
export const getTimezone = () => {
    return localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Format a date according to the user's preferences
export const formatDate = (date) => {
    const format = getDateFormat();
    const timezone = getTimezone();
    
    const dateObj = new Date(date);
    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    const [datePart, timePart] = formattedDate.split(', ');

    // Apply the user's preferred date format
    let formattedDatePart;
    switch (format) {
        case 'MM/DD/YYYY':
            formattedDatePart = datePart;
            break;
        case 'DD/MM/YYYY':
            const [month, day, year] = datePart.split('/');
            formattedDatePart = `${day}/${month}/${year}`;
            break;
        case 'YYYY-MM-DD':
            const [m, d, y] = datePart.split('/');
            formattedDatePart = `${y}-${m}-${d}`;
            break;
        default:
            formattedDatePart = datePart;
    }

    return `${formattedDatePart} ${timePart}`;
};

// Convert a date to the user's timezone
export const convertToUserTimezone = (date) => {
    const timezone = getTimezone();
    return new Date(date).toLocaleString('en-US', { timeZone: timezone });
};

// Format a relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return 'Just now';
};

// Format a date range
export const formatDateRange = (startDate, endDate) => {
    const format = getDateFormat();
    const timezone = getTimezone();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formattedStart = new Intl.DateTimeFormat('en-US', options).format(start);
    const formattedEnd = new Intl.DateTimeFormat('en-US', options).format(end);

    return `${formattedStart} - ${formattedEnd}`;
}; 
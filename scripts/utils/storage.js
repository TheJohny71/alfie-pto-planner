// Storage functions are now global
function saveEvents(events) {
    localStorage.setItem('events', JSON.stringify(events));
}

function getEvents() {
    return JSON.parse(localStorage.getItem('events')) || [];
}

function addEvent(event) {
    const events = getEvents();
    events.push(event);
    saveEvents(events);
}

function removeEvent(eventId) {
    const events = getEvents();
    const updatedEvents = events.filter(event => event.id !== eventId);
    saveEvents(updatedEvents);
}

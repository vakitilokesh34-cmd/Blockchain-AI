// Google Calendar Integration (Mock for MVP)

const scheduleMeeting = async (studentName, dateStr) => {
    // In a real app, this would use googleapis to create an event
    console.log(`[MOCK] Scheduling meeting for ${studentName} on ${dateStr}`);

    // Return a mock meeting link
    return {
        success: true,
        meetingLink: `https://meet.google.com/mock-link-${Date.now()}`,
        scheduledTime: dateStr || 'Tomorrow 10:00 AM'
    };
};

module.exports = { scheduleMeeting };

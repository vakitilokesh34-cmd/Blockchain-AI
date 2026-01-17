const { google } = require('googleapis');

// Helper to sanitize date
const parseDate = (dateStr) => {
    // Basic parser, simply returns string for now or could use a library like moment/date-fns
    // In a real app, strict parsing is needed
    return dateStr;
};

/**
 * Schedule a Google Meet event
 */
const scheduleMeeting = async (studentName, dateStr) => {
    // Check for credentials
    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
    };

    if (!credentials.client_email || !credentials.private_key) {
        console.warn('[CALENDAR] Missing Google credentials, falling back to mock.');
        return mockSchedule(studentName, dateStr);
    }

    try {
        // Fix for newline literals in .env
        const privateKey = credentials.private_key.replace(/\\n/g, '\n');

        const scoes = ['https://www.googleapis.com/auth/calendar'];
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            privateKey,
            scoes
        );

        const calendar = google.calendar({ version: 'v3', auth });

        // Calculate start/end time (assuming 30 min meeting)
        // Note: For MVP we might need to handle natural language date parsing better here
        // or rely on LLM to give ISO string. For now, we assume LLM might give informal string
        // so we default to tomorrow if parsing fails, or use a date parser.

        // Simple logic: if dateStr is "tomorrow 10am", we assume strictly formatted ISO for real API
        // or just use current time + 24h as fallback for this demo

        let startDateTime = new Date();
        startDateTime.setDate(startDateTime.getDate() + 1);
        startDateTime.setHours(10, 0, 0, 0);

        const event = {
            summary: `Academic Review: ${studentName}`,
            description: 'Mandatory attendance review meeting.',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(startDateTime.getTime() + 30 * 60000).toISOString(),
                timeZone: 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: 'sample123',
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        console.log(`[CALENDAR] Event created: ${res.data.htmlLink}`);

        return {
            success: true,
            meetingLink: res.data.conferenceData?.entryPoints?.[0]?.uri || res.data.htmlLink,
            scheduledTime: startDateTime.toLocaleString()
        };

    } catch (error) {
        console.error('[CALENDAR] API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const mockSchedule = (studentName, dateStr) => {
    console.log(`[MOCK-CALENDAR] Scheduling meeting for ${studentName} on ${dateStr}`);
    return {
        success: true,
        meetingLink: `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`,
        scheduledTime: dateStr || 'Tomorrow 10:00 AM'
    };
};

module.exports = { scheduleMeeting };

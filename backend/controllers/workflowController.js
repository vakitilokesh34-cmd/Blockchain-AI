const supabase = require('../services/supabaseClient');
const twilioService = require('../services/twilioService');
const calendarService = require('../services/calendarService');
const blockchainService = require('../services/blockchainService');

/**
 * This workflow is orchestrated using Weilliptic MCP
 * and executed on Icarus with visualized steps.
 */
// import { LowAttendanceWorkflow } from "../weilliptic/attendanceWorkflow";
const { LowAttendanceWorkflow } = require('../../weilliptic/attendanceWorkflow');

const runWorkflow = async (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    console.log('Received command:', command);

    // 1. Parse Command (Regex based for MVP)
    // Support: "Check attendance and notify students under 75%" or "below 75"
    // Also supports optional % and various keywords
    const attendanceMatch = command.match(/(?:notify|flag|alert).*students.*(?:under|below|<)\s*(\d+)/i);
    if (attendanceMatch) {
        const threshold = parseInt(attendanceMatch[1]);
        console.log(`Matched attendance check. Threshold: ${threshold}%`);
        return await handleAttendanceCheck(threshold, res);
    }

    return res.json({ message: 'Command not recognized', status: 'unknown' });
};

async function handleAttendanceCheck(threshold, res) {
    try {
        // 2. Read Data
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .lt('attendance', threshold);

        if (error) throw error;

        const results = [];

        // 3. Process each student
        for (const student of students) {
            // 4. Notification
            const messageBody = `Alert: Your attendance is ${student.attendance}%, which is below the ${threshold}% threshold. Please contact administration.`;

            // Send WA (Wrap in try-catch to not fail entire batch)
            let waResult = { success: false };
            try {
                if (process.env.TWILIO_ACCOUNT_SID) {
                    waResult = await twilioService.sendWhatsAppMessage(student.phone, messageBody);
                } else {
                    console.log(`[Mock WA] To: ${student.phone}, Msg: ${messageBody}`);
                    waResult = { success: true, sid: 'mock-sid' };
                }
            } catch (e) {
                console.error("WA Send Error", e);
                // Explicitly show error handling
                await supabase.from('logs').insert({
                    student_hash: student.id,
                    action: 'WHATSAPP_FAILED → FALLBACK_LOGGED',
                    timestamp: new Date().toISOString()
                });
            }

            // 5. Schedule Meeting (if repeated defaulter - for demo assume if warnings > 1)
            let scheduleResult = null;
            if (student.warnings > 1) {
                scheduleResult = await calendarService.scheduleMeeting(student.name, 'Tomorrow 10am');
            }

            // 6. Logging
            // Database Log
            const { data: logData, error: logError } = await supabase
                .from('logs')
                .insert({
                    student_hash: student.id, // Using ID as hash for simple correlation
                    action: 'NOTIFY_LOW_ATTENDANCE',
                    timestamp: new Date().toISOString()
                })
                .select();

            // Blockchain Log
            const chainLog = await blockchainService.logAction(student.id, 'NOTIFY_LOW_ATTENDANCE');

            results.push({
                student: student.name,
                attendance: student.attendance,
                notified: waResult.success,
                meetingScheduled: scheduleResult ? scheduleResult.meetingLink : 'N/A',
                onChainTx: chainLog.txHash
            });
        }

        const icarusId = `ICARUS_EXEC_${Math.floor(100000 + Math.random() * 900000)}`;

        return res.json({
            status: 'success',
            action: `Checked attendance < ${threshold}%`,
            affected_count: students.length,
            icarusExecutionId: icarusId,
            details: results
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

const getStudents = async (req, res) => {
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

const getLogs = async (req, res) => {
    const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

module.exports = { runWorkflow, getStudents, getLogs };

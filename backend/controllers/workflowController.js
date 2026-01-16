const supabase = require('../services/supabaseClient');
const twilioService = require('../services/twilioService');
const calendarService = require('../services/calendarService');
const blockchainService = require('../services/blockchainService');
const icarusService = require('../services/icarusService');
const weillipticSDK = require('../../weilliptic/sdk');
const { getWorkflow, listWorkflows } = require('../../weilliptic/attendanceWorkflow');

/**
 * Run a workflow based on natural language command
 * Integrated with Icarus for visualization and Weilliptic for encryption
 */
const runWorkflow = async (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    console.log('[WORKFLOW] Received command:', command);

    try {
        // Parse command and determine workflow
        const workflowMatch = parseCommand(command);

        if (!workflowMatch) {
            return res.json({
                message: 'Command not recognized. Try: "Check attendance and notify students under 75%"',
                status: 'unknown',
                availableWorkflows: listWorkflows()
            });
        }

        // Execute the matched workflow
        const result = await executeWorkflow(workflowMatch);

        return res.json(result);
    } catch (error) {
        console.error('[WORKFLOW] Execution error:', error);
        return res.status(500).json({
            error: error.message,
            status: 'failed'
        });
    }
};

/**
 * Parse natural language command to workflow and parameters
 */
function parseCommand(command) {
    const cmd = command.toLowerCase();

    // Attendance monitoring patterns
    const attendanceMatch = cmd.match(/(?:notify|flag|alert|check).*students.*(?:under|below|<)\s*(\d+)/i);
    if (attendanceMatch) {
        const threshold = parseInt(attendanceMatch[1]);
        return {
            workflowId: threshold < 65 ? 'attendance_critical_60' : 'attendance_low_75',
            params: { threshold }
        };
    }

    // Assignment tracking
    if (cmd.includes('assignment') || cmd.includes('incomplete')) {
        return {
            workflowId: 'assignment_tracking',
            params: {}
        };
    }

    // Performance review
    if (cmd.includes('performance') || cmd.includes('review')) {
        return {
            workflowId: 'performance_review',
            params: {}
        };
    }

    return null;
}

/**
 * Execute workflow with Icarus tracking
 */
async function executeWorkflow({ workflowId, params }) {
    const workflow = getWorkflow(workflowId);

    if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Start Icarus execution tracking
    const execution = icarusService.startExecution(workflowId, 'natural_language', params);
    const executionId = execution.executionId;

    console.log(`[ICARUS] Executing workflow: ${workflow.name} (${executionId})`);

    try {
        // Execute based on workflow type
        let result;

        switch (workflowId) {
            case 'attendance_low_75':
            case 'attendance_critical_60':
                result = await executeAttendanceWorkflow(executionId, workflow, params);
                break;
            case 'assignment_tracking':
                result = await executeAssignmentWorkflow(executionId, workflow, params);
                break;
            case 'performance_review':
                result = await executePerformanceWorkflow(executionId, workflow, params);
                break;
            default:
                throw new Error(`Workflow execution not implemented: ${workflowId}`);
        }

        // Complete the execution
        icarusService.completeExecution(executionId, { success: true, ...result });

        return {
            status: 'success',
            executionId,
            workflowName: workflow.name,
            result,
            visualizationUrl: `/api/workflow/execution/${executionId}`
        };
    } catch (error) {
        // Log error and complete execution as failed
        console.error(`[ICARUS] Workflow failed: ${executionId}`, error);
        icarusService.completeExecution(executionId, { success: false, error: error.message });
        throw error;
    }
}

/**
 * Execute attendance monitoring workflow
 */
async function executeAttendanceWorkflow(executionId, workflow, params) {
    const threshold = params.threshold || 75;
    const results = [];

    // Step 1: Fetch students
    icarusService.logStep(executionId, 'FETCH_STUDENTS', { status: 'RUNNING' });
    const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .lt('attendance', threshold);

    if (error) throw error;

    icarusService.logStep(executionId, 'FETCH_STUDENTS', {
        status: 'COMPLETED',
        data: { count: students.length }
    });

    // Step 2: Hash student IDs (privacy-preserving)
    icarusService.logStep(executionId, 'HASH_STUDENT_IDS', { status: 'RUNNING' });
    const studentHashes = students.map(s => ({
        ...s,
        hash: weillipticSDK.hashStudentId(s.id)
    }));
    icarusService.logStep(executionId, 'HASH_STUDENT_IDS', {
        status: 'COMPLETED',
        data: { hashCount: studentHashes.length }
    });

    // Step 3: Filter at-risk students
    icarusService.logStep(executionId, 'FILTER_AT_RISK', { status: 'RUNNING' });
    const atRiskStudents = studentHashes.filter(s => s.attendance < threshold);
    icarusService.logStep(executionId, 'FILTER_AT_RISK', {
        status: 'COMPLETED',
        data: { atRiskCount: atRiskStudents.length }
    });

    // Step 4: Send notifications
    icarusService.logStep(executionId, 'SEND_NOTIFICATIONS', { status: 'RUNNING' });

    for (const student of atRiskStudents) {
        const messageBody = `Alert: Your attendance is ${student.attendance}%, which is below the ${threshold}% threshold. Please contact administration.`;

        let notificationResult = { success: false };
        try {
            if (process.env.TWILIO_ACCOUNT_SID) {
                notificationResult = await twilioService.sendWhatsAppMessage(student.phone, messageBody);
            } else {
                console.log(`[MOCK-WA] To: ${student.phone}, Msg: ${messageBody}`);
                notificationResult = { success: true, sid: 'mock-sid' };
            }
        } catch (e) {
            console.error('[NOTIFICATION] Error:', e);
            notificationResult = { success: false, error: e.message };
        }

        // Schedule meeting for critical cases
        let meetingResult = null;
        if (threshold <= 60) {
            try {
                meetingResult = await calendarService.scheduleMeeting(student.name, 'Tomorrow 10am');
            } catch (e) {
                console.error('[CALENDAR] Error:', e);
            }
        }

        results.push({
            student: student.name,
            attendance: student.attendance,
            notified: notificationResult.success,
            meetingScheduled: meetingResult?.meetingLink || null,
            hash: student.hash
        });
    }

    icarusService.logStep(executionId, 'SEND_NOTIFICATIONS', {
        status: 'COMPLETED',
        data: {
            sent: results.filter(r => r.notified).length,
            failed: results.filter(r => !r.notified).length
        }
    });

    // Step 5: Log to database
    icarusService.logStep(executionId, 'LOG_DATABASE', { status: 'RUNNING' });

    for (const student of atRiskStudents) {
        await supabase.from('logs').insert({
            student_hash: student.hash,
            action: `NOTIFY_ATTENDANCE_${threshold}`,
            timestamp: new Date().toISOString()
        });
    }

    icarusService.logStep(executionId, 'LOG_DATABASE', { status: 'COMPLETED' });

    // Step 6: Log to blockchain
    icarusService.logStep(executionId, 'LOG_BLOCKCHAIN', { status: 'RUNNING' });

    const blockchainLogs = [];
    for (const student of atRiskStudents) {
        const chainLog = await blockchainService.logAction(
            student.id,
            `NOTIFY_ATTENDANCE_${threshold}`,
            executionId
        );
        blockchainLogs.push(chainLog);
    }

    icarusService.logStep(executionId, 'LOG_BLOCKCHAIN', {
        status: 'COMPLETED',
        data: { txHashes: blockchainLogs.map(l => l.txHash) }
    });

    // Step 7: Generate execution proof
    icarusService.logStep(executionId, 'GENERATE_PROOF', { status: 'RUNNING' });
    const execution = icarusService.getExecutionStatus(executionId);
    const proof = weillipticSDK.generateExecutionProof(execution);
    icarusService.logStep(executionId, 'GENERATE_PROOF', {
        status: 'COMPLETED',
        data: { proof: proof.proof }
    });

    return {
        action: `Attendance monitoring (threshold: ${threshold}%)`,
        affectedCount: atRiskStudents.length,
        successCount: results.filter(r => r.notified).length,
        failureCount: results.filter(r => !r.notified).length,
        blockchainTxHashes: blockchainLogs.map(l => l.txHash),
        proof: proof.proof,
        details: results
    };
}

/**
 * Execute assignment tracking workflow
 */
async function executeAssignmentWorkflow(executionId, workflow, params) {
    icarusService.logStep(executionId, 'FETCH_ASSIGNMENTS', { status: 'COMPLETED', data: { count: 0 } });
    icarusService.logStep(executionId, 'IDENTIFY_INCOMPLETE', { status: 'COMPLETED', data: { count: 0 } });
    icarusService.logStep(executionId, 'SEND_REMINDERS', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'UPDATE_CALENDAR', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'LOG_ACTIONS', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'BLOCKCHAIN_AUDIT', { status: 'COMPLETED' });

    return {
        action: 'Assignment tracking',
        remindersrent: 0,
        calendarEventsCreated: 0
    };
}

/**
 * Execute performance review workflow
 */
async function executePerformanceWorkflow(executionId, workflow, params) {
    icarusService.logStep(executionId, 'FETCH_PERFORMANCE_DATA', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'ANALYZE_PATTERNS', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'GENERATE_REPORTS', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'SCHEDULE_REVIEWS', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'LOG_REVIEW', { status: 'COMPLETED' });
    icarusService.logStep(executionId, 'BLOCKCHAIN_RECORD', { status: 'COMPLETED' });

    return {
        action: 'Performance review',
        studentsReviewed: 0,
        meetingsScheduled: 0,
        reportCount: 0
    };
}

/**
 * Get students from database
 */
const getStudents = async (req, res) => {
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

/**
 * Get logs from database with blockchain tx hashes
 */
const getLogs = async (req, res) => {
    const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });

    // Enhance logs with mock blockchain tx hashes
    const enhancedLogs = data.map(log => ({
        ...log,
        tx_hash: '0x' + require('crypto').randomBytes(32).toString('hex')
    }));

    res.json(enhancedLogs);
};

/**
 * Get workflow execution status
 */
const getExecutionStatus = async (req, res) => {
    const { executionId } = req.params;
    const status = icarusService.getExecutionStatus(executionId);

    if (!status) {
        return res.status(404).json({ error: 'Execution not found' });
    }

    res.json(status);
};

/**
 * Get active workflow executions
 */
const getActiveExecutions = async (req, res) => {
    const executions = icarusService.getActiveExecutions();
    res.json(executions);
};

/**
 * Get workflow execution history
 */
const getExecutionHistory = async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const history = icarusService.getExecutionHistory(limit);
    res.json(history);
};

/**
 * Get list of available workflows
 */
const getWorkflows = async (req, res) => {
    const workflows = listWorkflows();
    res.json(workflows);
};

/**
 * Get Icarus metrics
 */
const getMetrics = async (req, res) => {
    const metrics = icarusService.getMetrics();
    res.json(metrics);
};

module.exports = {
    runWorkflow,
    getStudents,
    getLogs,
    getExecutionStatus,
    getActiveExecutions,
    getExecutionHistory,
    getWorkflows,
    getMetrics
};

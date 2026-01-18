/**
 * Weilliptic Workflow Definitions
 * These workflows are executed by Icarus and visualized in real-time
 */

const workflows = {
    // Attendance Monitoring Workflows
    LowAttendanceWorkflow: {
        name: "Low Attendance Detection & Notification",
        id: "attendance_low_75",
        trigger: "natural_language",
        description: "Detect students below 75% attendance and send notifications",
        steps: [
            {
                id: "FETCH_STUDENTS",
                service: "Supabase",
                description: "Fetch all student records from database",
                action: "database_query",
                query: "SELECT * FROM students WHERE attendance < 75"
            },
            {
                id: "LOG_BLOCKCHAIN",
                service: "Ethereum",
                description: "Emit immutable audit event on-chain",
                action: "emit_event",
                contract: "WorkflowLog"
            },
            {
                id: "HASH_STUDENT_IDS",
                service: "Weilliptic",
                description: "Generate privacy-preserving hashes for student IDs",
                action: "encryption",
                algorithm: "SHA-256"
            },
            {
                id: "FILTER_AT_RISK",
                service: "Logic",
                condition: "attendance < 75",
                description: "Filter students at risk",
                action: "filter"
            },
            {
                id: "SEND_NOTIFICATIONS",
                service: "Twilio",
                description: "Send WhatsApp notifications to students",
                action: "send_message",
                parallel: true
            },
            {
                id: "LOG_DATABASE",
                service: "Supabase",
                description: "Log notification action to database",
                action: "database_insert",
                table: "logs"
            },
            {
                id: "GENERATE_PROOF",
                service: "Weilliptic",
                description: "Generate cryptographic execution proof",
                action: "generate_proof"
            }
        ],
        output: {
            type: "WorkflowExecutionSummary",
            fields: ["executionId", "affectedCount", "successCount", "failureCount", "blockchainTxHash", "proof"]
        }
    },

    CriticalAttendanceWorkflow: {
        name: "Critical Attendance Intervention",
        id: "attendance_critical_60",
        trigger: "natural_language",
        description: "Handle students below 65% attendance with escalated intervention",
        steps: [
            {
                id: "FETCH_CRITICAL_STUDENTS",
                service: "Supabase",
                description: "Fetch students with critical attendance",
                action: "database_query",
                query: "SELECT * FROM students WHERE attendance < 65"
            },
            {
                id: "LOG_BLOCKCHAIN",
                service: "Ethereum",
                description: "Record intervention on blockchain",
                action: "emit_event"
            },
            {
                id: "HASH_STUDENT_IDS",
                service: "Weilliptic",
                description: "Generate privacy hashes",
                action: "encryption"
            },
            {
                id: "SEND_URGENT_NOTIFICATIONS",
                service: "Twilio",
                description: "Send urgent WhatsApp notifications",
                action: "send_message",
                priority: "high"
            },
            {
                id: "SCHEDULE_MEETINGS",
                service: "GoogleCalendar",
                description: "Schedule intervention meetings",
                action: "create_event",
                parallel: true
            },
            {
                id: "NOTIFY_ADMINISTRATORS",
                service: "Twilio",
                description: "Alert administrators about critical cases",
                action: "send_message"
            },
            {
                id: "LOG_DATABASE",
                service: "Supabase",
                description: "Log intervention action",
                action: "database_insert"
            }
        ],
        output: {
            type: "InterventionSummary",
            fields: ["executionId", "criticalCount", "meetingsScheduled", "administratorsNotified"]
        }
    },

    AssignmentTrackingWorkflow: {
        name: "Assignment Completion Tracking",
        id: "assignment_tracking",
        trigger: "natural_language",
        description: "Track and notify students with incomplete assignments",
        steps: [
            {
                id: "FETCH_ASSIGNMENTS",
                service: "Supabase",
                description: "Fetch assignment completion data",
                action: "database_query"
            },
            {
                id: "BLOCKCHAIN_AUDIT",
                service: "Ethereum",
                description: "Create audit trail",
                action: "emit_event"
            },
            {
                id: "IDENTIFY_INCOMPLETE",
                service: "Logic",
                condition: "completed < total",
                description: "Identify students with incomplete work",
                action: "filter"
            },
            {
                id: "SEND_REMINDERS",
                service: "Twilio",
                description: "Send assignment reminders",
                action: "send_message"
            },
            {
                id: "UPDATE_CALENDAR",
                service: "GoogleCalendar",
                description: "Add deadline reminders to calendars",
                action: "create_event"
            },
            {
                id: "LOG_ACTIONS",
                service: "Supabase",
                description: "Log reminder actions",
                action: "database_insert"
            }
        ],
        output: {
            type: "AssignmentSummary",
            fields: ["executionId", "remindersEnt", "calendarEventsCreated"]
        }
    },

    PerformanceReviewWorkflow: {
        name: "Student Performance Review",
        id: "performance_review",
        trigger: "natural_language",
        description: "Comprehensive student performance analysis and reporting",
        steps: [
            {
                id: "FETCH_PERFORMANCE_DATA",
                service: "Supabase",
                description: "Gather all performance metrics",
                action: "database_query"
            },
            {
                id: "BLOCKCHAIN_RECORD",
                service: "Ethereum",
                description: "Immutable performance record",
                action: "emit_event"
            },
            {
                id: "ANALYZE_PATTERNS",
                service: "Logic",
                description: "Identify performance patterns and trends",
                action: "analysis"
            },
            {
                id: "GENERATE_REPORTS",
                service: "Logic",
                description: "Create performance reports",
                action: "generate_report"
            },
            {
                id: "SCHEDULE_REVIEWS",
                service: "GoogleCalendar",
                description: "Schedule performance review meetings",
                action: "create_event"
            },
            {
                id: "LOG_REVIEW",
                service: "Supabase",
                description: "Record review initiation",
                action: "database_insert"
            }
        ],
        output: {
            type: "PerformanceReviewSummary",
            fields: ["executionId", "studentsReviewed", "meetingsScheduled", "reportCount"]
        }
    },

};

/**
 * Get workflow by name or ID
 */
function getWorkflow(identifier) {
    return Object.values(workflows).find(
        w => w.name === identifier || w.id === identifier
    ) || null;
}

/**
 * List all available workflows
 */
function listWorkflows() {
    return Object.values(workflows).map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        stepCount: w.steps.length
    }));
}

module.exports = {
    workflows,
    getWorkflow,
    listWorkflows,
    // Backward compatibility
    LowAttendanceWorkflow: workflows.LowAttendanceWorkflow
};

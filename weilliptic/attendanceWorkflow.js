/**
 * Weilliptic MCP Workflow Definition
 * This file maps backend services to agentic steps
 * and is deployed to Icarus for visualization.
 */

const LowAttendanceWorkflow = {
    name: "LowAttendanceWorkflow",
    trigger: "natural_language",
    steps: [
        {
            id: "FETCH_ATTENDANCE",
            service: "Supabase",
            description: "Fetch student attendance records"
        },
        {
            id: "FILTER_LOW_ATTENDANCE",
            condition: "attendance < 75",
            description: "Identify at-risk students"
        },
        {
            id: "SEND_WHATSAPP",
            service: "Twilio",
            description: "Notify students via WhatsApp"
        },
        {
            id: "SCHEDULE_MEETING",
            condition: "attendance < 60",
            service: "Google Calendar",
            description: "Schedule escalation meeting"
        },
        {
            id: "ONCHAIN_LOG",
            service: "Blockchain",
            description: "Emit on-chain audit event"
        }
    ],
    output: "WorkflowExecutionSummary"
};

module.exports = { LowAttendanceWorkflow };

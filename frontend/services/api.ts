import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3002/api',
});

// Student data
export const getStudents = async () => {
    try {
        const res = await api.get('/students');
        return res.data;
    } catch (error) {
        console.error("Error fetching students", error);
        return [];
    }
};

// Logs and audit trail
export const getLogs = async () => {
    try {
        const res = await api.get('/logs');
        return res.data;
    } catch (error) {
        console.error("Error fetching logs", error);
        return [];
    }
};

// Workflow execution
export const runWorkflow = async (command: string) => {
    try {
        const res = await api.post('/workflow/run', { command });
        return res.data;
    } catch (error) {
        console.error("Error running workflow", error);
        return { error: 'Failed to run workflow' };
    }
};

// Get specific workflow execution status
export const getExecutionStatus = async (executionId: string) => {
    try {
        const res = await api.get(`/workflow/execution/${executionId}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching execution status", error);
        return null;
    }
};

// Get active workflow executions
export const getActiveExecutions = async () => {
    try {
        const res = await api.get('/workflow/executions/active');
        return res.data;
    } catch (error) {
        console.error("Error fetching active executions", error);
        return [];
    }
};

// Get workflow execution history
export const getExecutionHistory = async (limit = 50) => {
    try {
        const res = await api.get(`/workflow/executions/history?limit=${limit}`);
        return res.data;
    } catch (error) {
        console.error("Error fetching execution history", error);
        return [];
    }
};

// Get list of available workflows
export const getWorkflows = async () => {
    try {
        const res = await api.get('/workflow/list');
        return res.data;
    } catch (error) {
        console.error("Error fetching workflows", error);
        return [];
    }
};

// Get Icarus metrics
export const getIcarusMetrics = async () => {
    try {
        const res = await api.get('/workflow/metrics');
        return res.data;
    } catch (error) {
        console.error("Error fetching metrics", error);
        return null;
    }
};

// Get assignments
export const getAssignments = async () => {
    try {
        const res = await api.get('/assignments');
        return res.data;
    } catch (error) {
        console.error("Error fetching assignments", error);
        return [];
    }
};

export default api;

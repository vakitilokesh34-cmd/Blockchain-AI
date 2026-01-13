import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3002/api',
});

export const getStudents = async () => {
    try {
        const res = await api.get('/students');
        return res.data;
    } catch (error) {
        console.error("Error fetching students", error);
        return [];
    }
};

export const getLogs = async () => {
    try {
        const res = await api.get('/logs');
        return res.data;
    } catch (error) {
        console.error("Error fetching logs", error);
        return [];
    }
};

export const runWorkflow = async (command: string) => {
    try {
        const res = await api.post('/workflow/run', { command });
        return res.data;
    } catch (error) {
        console.error("Error running workflow", error);
        return { error: 'Failed to run workflow' };
    }
};

export default api;

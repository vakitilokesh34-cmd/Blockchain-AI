'use client';

import { useState, useEffect } from 'react';
import { getStudents, getLogs, runWorkflow } from '../services/api';

export default function Dashboard() {
    const [students, setStudents] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fetchData = async () => {
        const s = await getStudents();
        const l = await getLogs();
        setStudents(s);
        setLogs(l);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRun = async () => {
        setLoading(true);
        const res = await runWorkflow(command);
        setResult(res);
        setLoading(false);
        fetchData(); // Refresh data
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Smart Autonomous University Agent</h1>
                <p className="text-gray-600">Automated Academic Workflow Engine</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Command Center */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-purple-700">Agent Command Interface</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 rounded text-black"
                            placeholder='e.g., "Check attendance and notify students under 75%"'
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                        />
                        <button
                            onClick={handleRun}
                            disabled={loading}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Running...' : 'Run Workflow'}
                        </button>
                    </div>

                    {result && (
                        <div className="bg-gray-50 p-4 rounded border text-sm">
                            <h3 className="font-bold mb-2">Workflow Result:</h3>
                            <pre className="text-gray-700 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    )}
                </div>

                {/* Student Status */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">Student Attendance Status</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-black">Name</th>
                                    <th className="p-2 text-black">Attendance</th>
                                    <th className="p-2 text-black">Phone</th>
                                    <th className="p-2 text-black">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-b hover:bg-gray-50 text-black">
                                        <td className="p-2">{s.name}</td>
                                        <td className="p-2 font-mono">{s.attendance}%</td>
                                        <td className="p-2 text-sm text-gray-500">{s.phone}</td>
                                        <td className="p-2">
                                            {s.attendance < 75 ? (
                                                <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded">AT RISK</span>
                                            ) : (
                                                <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">OK</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Logs */}
                <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Audit Logs (On-Chain + DB)</h2>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 text-black">Timestamp</th>
                                    <th className="p-2 text-black">Student ID (Hash)</th>
                                    <th className="p-2 text-black">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.id} className="text-black">
                                        <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-2 font-mono text-xs">{log.student_hash}</td>
                                        <td className="p-2 font-semibold">{log.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

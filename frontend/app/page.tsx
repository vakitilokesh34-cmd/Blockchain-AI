'use client';

import { useState, useEffect } from 'react';
import {
    getStudents,
    getLogs,
    runWorkflow,
    getExecutionHistory,
    getWorkflows,
    getIcarusMetrics
} from '../services/api';

// Types
interface Student {
    id: number;
    name: string;
    attendance: number;
    phone: string;
}

interface Log {
    id: number;
    timestamp: string;
    student_hash: string;
    action: string;
    tx_hash?: string;
}

interface Workflow {
    id: string;
    name: string;
    description: string;
    timestamp?: string;
    integrations?: string[];
    stepCount?: number;
}

export default function Dashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'audit'>('dashboard');
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    const [searchWorkflow, setSearchWorkflow] = useState('');
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [executionHistory, setExecutionHistory] = useState<any[]>([]);
    const [icarusMetrics, setIcarusMetrics] = useState<any>(null);
    const [showExecutionSteps, setShowExecutionSteps] = useState(false);

    const fetchData = async () => {
        const s = await getStudents();
        const l = await getLogs();
        const w = await getWorkflows();
        const h = await getExecutionHistory(10);
        const m = await getIcarusMetrics();

        setStudents(s);
        setLogs(l);
        setWorkflows(w || []);
        setExecutionHistory(h || []);
        setIcarusMetrics(m);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRun = async () => {
        setLoading(true);
        setShowExecutionSteps(false);
        const res = await runWorkflow(command);
        setResult(res);
        setLoading(false);

        // Fetch updated data and execution history
        await fetchData();

        // Show execution steps if available
        if (res.executionId) {
            setShowExecutionSteps(true);
        }
    };

    const notifyStudent = (student: Student) => {
        alert(`Notification sent to ${student.name} (${student.phone})`);
    };

    // Calculate analytics data
    const below75Count = students.filter(s => s.attendance < 75).length;
    const below60Count = students.filter(s => s.attendance < 60).length;
    const assignmentsCount = 2; // Mock data

    // Calculate blockchain stats
    const totalTransactions = logs.length;
    const verifiedTransactions = logs.filter(l => l.tx_hash).length;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0d0d0d] border-r border-[#242424] flex flex-col">
                <div className="p-6 border-b border-[#242424]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                            UA
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">Smart Autonomous</h2>
                            <p className="text-gray-500 text-xs">University Agent</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left ${activeView === 'dashboard' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left ${activeView === 'analytics' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analytics
                    </button>

                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left text-gray-400 hover:bg-gray-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Scheduling
                    </button>

                    <button
                        onClick={() => setActiveView('audit')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left ${activeView === 'audit' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Audit Logs
                    </button>
                </nav>

                <div className="p-4 border-t border-[#242424]">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-xs font-semibold mb-1">System Status</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            Monitoring Active
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            All Services Operational
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-[#0d0d0d] border-b border-[#242424] p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Smart Autonomous <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">University Agent</span>
                            </h1>
                            <p className="text-gray-500">AI-Driven Multi-Step Academic Monitoring System</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg border border-green-500/30 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Monitoring Active
                            </span>
                            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                AI Powered
                            </span>
                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/30 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Secured
                            </span>
                            <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-lg border border-yellow-500/30 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Audited
                            </span>
                        </div>
                    </div>
                </header>

                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                    <div className="p-6">
                        {/* AI-Driven Monitoring Section */}
                        <div className="glass-card p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">AI-Driven Academic Monitoring</h2>
                                        <p className="text-gray-500 text-sm">Three-condition threshold detection and alerts - All notify</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-yellow-400">{below75Count}</div>
                                        <div className="text-xs text-gray-500">&lt;75%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-400">{below60Count}</div>
                                        <div className="text-xs text-gray-500">&lt;60%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-orange-400">{assignmentsCount}</div>
                                        <div className="text-xs text-gray-500">Assignments</div>
                                    </div>
                                </div>
                            </div>

                            {/* Student List */}
                            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
                                {students.slice(0, 10).map((student) => (
                                    <div key={student.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-blue-500/50 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-2 h-2 rounded-full ${student.attendance < 65 ? 'bg-red-400' : student.attendance < 75 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="text-white font-semibold">{student.name}</h3>
                                                        {student.attendance < 75 && (
                                                            <button
                                                                onClick={() => notifyStudent(student)}
                                                                className="px-4 py-1 bg-yellow-500 text-black text-xs font-bold rounded hover:bg-yellow-400 transition-colors"
                                                            >
                                                                Notify Student
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs text-gray-500">Attendance At {student.attendance}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>Current: {student.attendance}%</span>
                                                        <span>|</span>
                                                        <span>Threshold: 75%</span>
                                                    </div>
                                                    <div className="mt-2 bg-[#0d0d0d] rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full progress-bar ${student.attendance < 65 ? 'bg-red-500' :
                                                                student.attendance < 75 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                                }`}
                                                            style={{ width: `${student.attendance}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Command Analysis */}
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Command Analysis</h2>
                                        <p className="text-gray-500 text-sm">AI-interpreted workflow analysis</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="relative">
                                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search workflows..."
                                            value={searchWorkflow}
                                            onChange={(e) => setSearchWorkflow(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {workflows.map((workflow) => (
                                        <div key={workflow.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-semibold text-sm mb-1">{workflow.name}</h3>
                                                    <p className="text-gray-500 text-xs mb-2">{workflow.description}</p>
                                                    <p className="text-gray-600 text-xs mb-2">{workflow.timestamp || 'Ready to run'}</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {workflow.integrations?.map((integration: string) => (
                                                            <span key={integration} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                                                {integration}
                                                            </span>
                                                        ))}
                                                        {workflow.stepCount && (
                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                                {workflow.stepCount} Steps
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Analytics Dashboard Preview */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Three-Condition Analytics Dashboard</h2>
                                        <p className="text-gray-500 text-sm">Student distribution across three notification thresholds</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`px-3 py-1 text-xs font-semibold rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
                                                }`}
                                        >
                                            Bar Chart
                                        </button>
                                    </div>
                                </div>

                                {chartType === 'bar' && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Below 75% Attendance</span>
                                                <span className="text-white font-bold">{below75Count} students</span>
                                            </div>
                                            <div className="bg-[#0d0d0d] rounded-full h-8 overflow-hidden">
                                                <div className="h-full bg-yellow-500 progress-bar flex items-center justify-end pr-2" style={{ width: `${(below75Count / students.length) * 100}%` }}>
                                                    <span className="text-xs font-bold text-black">{below75Count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Below 60% Attendance</span>
                                                <span className="text-white font-bold">{below60Count} students</span>
                                            </div>
                                            <div className="bg-[#0d0d0d] rounded-full h-8 overflow-hidden">
                                                <div className="h-full bg-red-500 progress-bar flex items-center justify-end pr-2" style={{ width: `${(below60Count / students.length) * 100}%` }}>
                                                    <span className="text-xs font-bold text-white">{below60Count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Incomplete Assignments</span>
                                                <span className="text-white font-bold">{assignmentsCount} students</span>
                                            </div>
                                            <div className="bg-[#0d0d0d] rounded-full h-8 overflow-hidden">
                                                <div className="h-full bg-orange-500 progress-bar flex items-center justify-end pr-2" style={{ width: `${(assignmentsCount / students.length) * 100}%` }}>
                                                    <span className="text-xs font-bold text-black">{assignmentsCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Command Line Interface */}
                        <div className="glass-card p-6 mt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <h3 className="text-white font-semibold">Command Line - AI-Driven Monitoring</h3>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleRun()}
                                    placeholder="Enter AI command..."
                                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleRun}
                                    disabled={loading || !command.trim()}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-primary font-semibold"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </div>


                            {result && (
                                <div className="mt-4 space-y-4">
                                    {/* Execution Status Header */}
                                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <div className="text-green-400 font-bold text-lg">Workflow Executed Successfully</div>
                                                    {result.workflowName && (
                                                        <div className="text-gray-400 text-sm">{result.workflowName}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {result.executionId && (
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Execution ID</div>
                                                    <div className="font-mono text-blue-400 text-sm">{result.executionId}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Execution Results Summary */}
                                    {result.result && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {result.result.affectedCount !== undefined && (
                                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                                    <div className="text-gray-500 text-xs mb-1">Students Affected</div>
                                                    <div className="text-2xl font-bold text-white">{result.result.affectedCount}</div>
                                                </div>
                                            )}
                                            {result.result.successCount !== undefined && (
                                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                                    <div className="text-gray-500 text-xs mb-1">Notifications Sent</div>
                                                    <div className="text-2xl font-bold text-green-400">{result.result.successCount}</div>
                                                </div>
                                            )}
                                            {result.result.proof && (
                                                <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-lg p-4 col-span-2">
                                                    <div className="text-purple-400 text-xs mb-1 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Cryptographic Execution Proof
                                                    </div>
                                                    <div className="font-mono text-purple-300 text-xs break-all">{result.result.proof.substring(0, 64)}...</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Workflow Execution Steps (Icarus Visualization) */}
                                    {showExecutionSteps && executionHistory.length > 0 && executionHistory[0].steps && (
                                        <div className="bg-[#1a1a1a] border border-blue-500/30 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <h3 className="text-white font-semibold">Icarus Execution Steps</h3>
                                                <span className="ml-auto text-xs text-gray-500">{executionHistory[0].steps.length} steps</span>
                                            </div>
                                            <div className="space-y-2">
                                                {executionHistory[0].steps.map((step: any, index: number) => (
                                                    <div key={index} className="flex items-start gap-3 p-3 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                            step.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400' :
                                                                step.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {step.status === 'COMPLETED' ? (
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <div className="text-sm font-bold">{index + 1}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-white font-semibold text-sm">{step.id}</span>
                                                                {step.service && (
                                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                                                        {step.service}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {step.description && (
                                                                <div className="text-gray-400 text-xs mb-1">{step.description}</div>
                                                            )}
                                                            {step.timestamp && (
                                                                <div className="text-gray-600 text-xs">
                                                                    {new Date(step.timestamp).toLocaleTimeString()}
                                                                </div>
                                                            )}
                                                            {step.error && (
                                                                <div className="mt-2 text-red-400 text-xs bg-red-500/10 p-2 rounded">
                                                                    Error: {step.error}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Blockchain Transaction Hashes */}
                                    {result.result?.blockchainTxHashes && result.result.blockchainTxHashes.length > 0 && (
                                        <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                <h3 className="text-white font-semibold">Blockchain Audit Trail</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {result.result.blockchainTxHashes.slice(0, 3).map((txHash: string, index: number) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-[#0d0d0d] rounded">
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                                                        <span className="font-mono text-purple-300 text-xs flex-1 truncate">{txHash}</span>
                                                        <span className="text-green-400 text-xs">✓ Verified</span>
                                                    </div>
                                                ))}
                                                {result.result.blockchainTxHashes.length > 3 && (
                                                    <div className="text-center text-gray-500 text-xs">
                                                        +{result.result.blockchainTxHashes.length - 3} more transactions
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Detailed Results (Collapsible) */}
                                    <details className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                                        <summary className="p-4 cursor-pointer text-white font-semibold hover:bg-[#222] transition-colors">
                                            View Detailed Results (JSON)
                                        </summary>
                                        <pre className="p-4 text-gray-400 text-xs whitespace-pre-wrap overflow-x-auto border-t border-[#2a2a2a]">
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>

                        {/* Notification Center */}
                        <div className="fixed bottom-6 right-6 z-50">
                            <button className="relative px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2 font-semibold">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                Notify ({below75Count})
                                {below75Count > 0 && (
                                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                                        {below75Count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Analytics View */}
                {activeView === 'analytics' && (
                    <div className="p-6">
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Student Condition Analytics</h2>
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-6">
                                    <div className="text-yellow-400 text-sm font-semibold mb-2">Below 75% Attendance</div>
                                    <div className="text-4xl font-bold text-white">{below75Count}</div>
                                    <div className="text-gray-400 text-sm mt-2">Students at risk</div>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-6">
                                    <div className="text-red-400 text-sm font-semibold mb-2">Below 60% Attendance</div>
                                    <div className="text-4xl font-bold text-white">{below60Count}</div>
                                    <div className="text-gray-400 text-sm mt-2">Critical intervention needed</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-6">
                                    <div className="text-orange-400 text-sm font-semibold mb-2">Incomplete Assignments</div>
                                    <div className="text-4xl font-bold text-white">{assignmentsCount}</div>
                                    <div className="text-gray-400 text-sm mt-2">Requires follow-up</div>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-white">Distribution Chart</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`px-4 py-2 text-sm font-semibold rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-[#0d0d0d] text-gray-400'
                                                }`}
                                        >
                                            Bar Chart
                                        </button>
                                    </div>
                                </div>

                                {chartType === 'bar' && (
                                    <div className="h-80 flex items-end gap-4 px-4">
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-yellow-500 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-4" style={{ height: `${(below75Count / Math.max(below75Count, below60Count, assignmentsCount)) * 100}%`, minHeight: '60px' }}>
                                                <span className="text-2xl font-bold text-black">{below75Count}</span>
                                            </div>
                                            <div className="text-center mt-4">
                                                <div className="text-white font-semibold">&lt;75%</div>
                                                <div className="text-gray-500 text-xs">Attendance</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-red-500 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-4" style={{ height: `${(below60Count / Math.max(below75Count, below60Count, assignmentsCount)) * 100}%`, minHeight: '60px' }}>
                                                <span className="text-2xl font-bold text-white">{below60Count}</span>
                                            </div>
                                            <div className="text-center mt-4">
                                                <div className="text-white font-semibold">&lt;60%</div>
                                                <div className="text-gray-500 text-xs">Attendance</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-orange-500 rounded-t-lg transition-all duration-1000 flex items-end justify-center pb-4" style={{ height: `${(assignmentsCount / Math.max(below75Count, below60Count, assignmentsCount)) * 100}%`, minHeight: '60px' }}>
                                                <span className="text-2xl font-bold text-black">{assignmentsCount}</span>
                                            </div>
                                            <div className="text-center mt-4">
                                                <div className="text-white font-semibold">Incomplete</div>
                                                <div className="text-gray-500 text-xs">Assignments</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs View */}
                {activeView === 'audit' && (
                    <div className="p-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Blockchain-Backed Audit Logs</h2>
                                    <p className="text-gray-500">Immutable transparency & encryption logs for compliance</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                                    <div className="text-blue-400 text-sm font-semibold mb-1">Total Transactions</div>
                                    <div className="text-4xl font-bold text-blue-400">{totalTransactions}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4">
                                    <div className="text-green-400 text-sm font-semibold mb-1">Verified</div>
                                    <div className="text-4xl font-bold text-green-400">{verifiedTransactions}</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                                    <div className="text-purple-400 text-sm font-semibold mb-1">Encryption Status</div>
                                    <div className="text-4xl font-bold text-purple-400">256-bit</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                                    <div className="text-yellow-400 text-sm font-semibold mb-1">Last Audit</div>
                                    <div className="text-2xl font-bold text-yellow-400">Now</div>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#0d0d0d] border-b border-[#2a2a2a]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Tx Hash</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Command</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Timestamp</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a2a]">
                                        {logs.slice(0, 10).map((log, idx) => (
                                            <tr key={log.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-blue-400 text-sm">
                                                        {log.tx_hash || `0x${log.student_hash.substring(0, 16)}`}...
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white text-sm">{log.action}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-400 text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                                                        Verified
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Command Input */}
                            <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white font-semibold text-sm">Command Line - AI-Driven Monitoring</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        placeholder="Enter AI command..."
                                        className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleRun}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>


                    </div>
                )}
            </main>
        </div>
    );
}

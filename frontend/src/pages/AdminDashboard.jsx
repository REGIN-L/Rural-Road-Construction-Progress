import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2,
    HardHat,
    CheckCircle2,
    AlertTriangle,
    IndianRupee,
    PlusCircle,
    ArrowRight,
    PieChart as PieIcon,
    TrendingUp,
    FileSpreadsheet,
    Trash2,
    MessageSquare
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';
import { getDashboardStats } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await getDashboardStats();
                setStats(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load admin statistics from server.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner text="Fetching live dashboard analytics from MongoDB..." />;

    if (error || !stats) {
        return (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {error || 'Unable to load stats.'}
            </div>
        );
    }

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
                        Executive Project & Financial Dashboard
                    </h1>
                    <p className="text-xs text-slate-500">
                        Real-time state infrastructure oversight, progress metrics, and budget utilization
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/admin/projects/create"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" /> Create New Project
                    </Link>
                    <Link
                        to="/admin/reports"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Reports
                    </Link>
                </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="custom-card p-5 space-y-2 border-l-4 border-l-blue-600">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Total Projects</span>
                        <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                        {stats.totalProjects}
                    </div>
                    <span className="text-[11px] text-slate-400">All Registered Work Corridors</span>
                </div>

                <div className="custom-card p-5 space-y-2 border-l-4 border-l-emerald-600">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>On Track Works</span>
                        <HardHat className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700 font-['Space_Grotesk']">
                        {stats.activeProjects}
                    </div>
                    <span className="text-[11px] text-slate-400">Progressing per Schedule</span>
                </div>

                <div className="custom-card p-5 space-y-2 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Delayed / Critical</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-700 font-['Space_Grotesk']">
                        {stats.delayedProjects + stats.criticalProjects}
                    </div>
                    <span className="text-[11px] text-slate-400">Requires Admin Attention</span>
                </div>

                <div className="custom-card p-5 space-y-2 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Completed Projects</span>
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600 font-['Space_Grotesk']">
                        {stats.completedProjects}
                    </div>
                    <span className="text-[11px] text-slate-400">100% Paved & Handed Over</span>
                </div>

            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

                <div className="custom-card p-4 space-y-1 bg-slate-900 text-white">
                    <span className="text-[11px] text-slate-400 font-medium">Total Sanctioned Budget</span>
                    <div className="text-xl font-bold font-['Space_Grotesk']">
                        {formatCurrency(stats.totalBudget)}
                    </div>
                </div>

                <div className="custom-card p-4 space-y-1 bg-emerald-950/80 border-emerald-800 text-white">
                    <span className="text-[11px] text-emerald-400 font-medium">Total Amount Spent</span>
                    <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-300">
                        {formatCurrency(stats.totalSpent)}
                    </div>
                </div>

                <div className="custom-card p-4 space-y-1 bg-slate-900 text-white">
                    <span className="text-[11px] text-slate-400 font-medium">Remaining Funds</span>
                    <div className="text-xl font-bold font-['Space_Grotesk'] text-slate-200">
                        {formatCurrency(stats.remainingBudget)}
                    </div>
                </div>

                <div className="custom-card p-4 space-y-1 bg-white border-emerald-200">
                    <span className="text-[11px] text-emerald-800 font-semibold">Fund Utilization Rate</span>
                    <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-emerald-700">
                        {stats.fundUtilization}%
                    </div>
                </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Chart 1: Project Progress & Expenditure Comparison */}
                <div className="lg:col-span-8 custom-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                            Project Budget vs Actual Expenditure (₹ in Bytes / INR)
                        </h2>
                        <span className="text-xs text-slate-400">Top Corridors</span>
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.financialComparison}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="Allocated" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Project Status Donut */}
                <div className="lg:col-span-4 custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                        Status Breakdown
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="count"
                                >
                                    {stats.statusChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Governance & Citizen Inquiries Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    to="/admin/deletion-requests"
                    className="custom-card p-5 hover:border-amber-400 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                Project Deletion Requests
                            </h3>
                            <p className="text-xs text-slate-500">
                                Review and approve deletion requests submitted by field engineers
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                    to="/admin/public-queries"
                    className="custom-card p-5 hover:border-blue-400 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                Citizen Public Queries &amp; Complaints
                            </h3>
                            <p className="text-xs text-slate-500">
                                Respond to road damage, fund misuse, and construction inquiries
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>

        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FolderCheck,
    HardHat,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    LogIn,
    IndianRupee,
    Building2,
    ShieldCheck,
    MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getPublicStats, getPublicProjects } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

export default function PublicHome() {
    const [stats, setStats] = useState(null);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, projRes] = await Promise.all([
                    getPublicStats(),
                    getPublicProjects()
                ]);
                setStats(statsRes.data);
                setFeaturedProjects(projRes.data.slice(0, 3));
            } catch (err) {
                console.error('Failed to load public stats:', err);
                setError('Failed to load live statistics from the backend server.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    return (
        <div className="space-y-12 pb-12">

            {/* Hero Banner Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-inner">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                    <div className="md:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            Official Public Monitoring Portal
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Space_Grotesk'] leading-tight tracking-tight">
                            RuralConnect – Rural Road Construction Monitoring System
                        </h1>

                        <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
                            Track rural road construction progress and public project information transparently across all blocks and districts without requiring a user account.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link
                                to="/public/projects"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                            >
                                <FolderCheck className="w-5 h-5" />
                                View Project Status
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all cursor-pointer"
                            >
                                <LogIn className="w-4 h-4 text-emerald-400" />
                                Staff Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-slate-600 font-bold text-sm transition-all cursor-pointer"
                            >
                                Create Engineer or Contractor Account
                            </Link>
                        </div>
                    </div>

                    <div className="md:col-span-5 hidden md:block">
                        <div className="custom-card p-6 bg-slate-800/80 border-slate-700 space-y-4 shadow-2xl text-slate-200">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                                    State Infrastructure Snapshot
                                </span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                                    LIVE API DATA
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                                    <span className="text-slate-400 block text-[11px]">Total Public Roads</span>
                                    <span className="text-xl font-bold text-white font-['Space_Grotesk']">
                                        {stats ? stats.totalPublicProjects : '...'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                                    <span className="text-slate-400 block text-[11px]">Avg Construction Progress</span>
                                    <span className="text-xl font-bold text-emerald-400 font-['Space_Grotesk']">
                                        {stats ? `${stats.avgProgress}%` : '...'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
                                <span className="text-slate-400 text-[11px] block">Public Capital Allocated</span>
                                <span className="text-lg font-bold text-white font-['Space_Grotesk']">
                                    {stats ? formatCurrency(stats.totalPublicBudget) : '...'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

                {loading ? (
                    <LoadingSpinner text="Fetching verified project metrics from backend..." />
                ) : error ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Public Statistics Metric Cards */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
                                        Public Infrastructure Overview
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Real-time monitoring metrics compiled directly from MongoDB project records
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                                <div className="custom-card p-4 space-y-2 border-l-4 border-l-blue-600">
                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                        <span>Total Projects</span>
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                                        {stats.totalPublicProjects}
                                    </div>
                                    <span className="text-[11px] text-slate-400">Approved Public Projects</span>
                                </div>

                                <div className="custom-card p-4 space-y-2 border-l-4 border-l-emerald-600">
                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                        <span>Under Construction</span>
                                        <HardHat className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-emerald-700 font-['Space_Grotesk']">
                                        {stats.underConstructionProjects}
                                    </div>
                                    <span className="text-[11px] text-slate-400">Active Work Corridors</span>
                                </div>

                                <div className="custom-card p-4 space-y-2 border-l-4 border-l-blue-500">
                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                        <span>Completed Roads</span>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-blue-600 font-['Space_Grotesk']">
                                        {stats.completedProjects}
                                    </div>
                                    <span className="text-[11px] text-slate-400">Finished & Verified</span>
                                </div>

                                <div className="custom-card p-4 space-y-2 border-l-4 border-l-amber-500">
                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                        <span>Delayed Projects</span>
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-amber-700 font-['Space_Grotesk']">
                                        {stats.delayedProjects}
                                    </div>
                                    <span className="text-[11px] text-slate-400">Behind Schedule</span>
                                </div>

                                <div className="custom-card p-4 space-y-2 border-l-4 border-l-teal-600">
                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                        <span>Avg Progress</span>
                                        <TrendingUp className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                                        {stats.avgProgress}%
                                    </div>
                                    <span className="text-[11px] text-slate-400">Statewide Average</span>
                                </div>

                            </div>
                        </div>

                        {/* Recharts Analytics Charts Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Chart 1: Projects by Status */}
                            <div className="custom-card p-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                                    Public Projects Distribution by Status
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="count"
                                            >
                                                {stats.statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Public Capital Allocation vs Utilization */}
                            <div className="custom-card p-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                                    Public Fund Allocation vs Expenditure
                                </h3>
                                <div className="h-64 flex flex-col justify-center space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Total Approved Budget:</span>
                                        <span className="font-bold text-slate-900 font-mono">{formatCurrency(stats.totalPublicBudget)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Amount Spent To Date:</span>
                                        <span className="font-bold text-emerald-700 font-mono">{formatCurrency(stats.totalPublicAmountSpent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
                                        <span className="text-slate-500 font-medium">Fund Utilization Rate:</span>
                                        <span className="font-extrabold text-blue-600 text-sm">{stats.overallUtilization}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${stats.overallUtilization}%` }} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Featured Public Projects */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
                                        Featured Approved Projects
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Latest active rural corridor construction updates
                                    </p>
                                </div>
                                <Link
                                    to="/public/projects"
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                >
                                    View All Projects <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {featuredProjects.map((p) => (
                                    <ProjectCard key={p._id || p.projectId} project={p} />
                                ))}
                            </div>
                        </div>

                        {/* Citizen Query CTA Section */}
                        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-8 text-white space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-['Space_Grotesk']">Report a Road Issue</h2>
                                    <p className="text-slate-400 text-xs">File a complaint about road damage, fund misuse, or incomplete work</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Citizens can report road conditions, construction quality issues, or project delays directly to the PWD administration. All submissions are tracked and addressed transparently.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Link
                                    to="/public/submit-query"
                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm text-center transition-colors"
                                >
                                    Submit a Complaint
                                </Link>
                                <Link
                                    to="/public/track-query"
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm text-center transition-colors border border-white/20"
                                >
                                    Track Existing Query
                                </Link>
                            </div>
                        </div>

                    </>
                )}

            </div>

        </div>
    );
}


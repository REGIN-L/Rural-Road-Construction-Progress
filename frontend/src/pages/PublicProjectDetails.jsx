import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin,
    Navigation,
    Calendar,
    Building2,
    IndianRupee,
    ArrowLeft,
    Clock,
    CheckCircle2,
    ShieldCheck,
    HardHat,
    MessageSquare
} from 'lucide-react';
import { getPublicProjectById } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function PublicProjectDetails() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const res = await getPublicProjectById(id);
                setProject(res.data);
            } catch (err) {
                console.error(err);
                setError('Public project record not found or not configured for public viewing.');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return <LoadingSpinner text="Loading public project records..." />;

    if (error || !project) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm max-w-md mx-auto">
                    {error || 'Project not found.'}
                </div>
                <Link to="/public/projects" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                    <ArrowLeft className="w-4 h-4" /> Back to Projects Directory
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Back Link */}
            <Link
                to="/public/projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Approved Public Projects
            </Link>

            {/* Main Header Card */}
            <div className="custom-card p-6 space-y-4 border-t-4 border-t-emerald-600">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                                {project.projectId}
                            </span>
                            <StatusBadge status={project.status} />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk']">
                            {project.projectName}
                        </h1>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{project.village}, {project.district}, {project.state}</span>
                        </div>
                    </div>

                    <div className="text-right sm:text-right text-xs space-y-1">
                        <span className="text-slate-400 block font-medium">Public Status</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Public Record
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {project.publicDescription || 'Standard rural road connectivity project under Department of Rural Development.'}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="text-slate-400 font-medium block">Road Length</span>
                        <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-['Space_Grotesk']">
                            <Navigation className="w-4 h-4 text-emerald-600" />
                            {project.roadLength} Km
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="text-slate-400 font-medium block">Start Date</span>
                        <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-['Space_Grotesk']">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {formatDate(project.startDate)}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="text-slate-400 font-medium block">Expected Completion</span>
                        <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-['Space_Grotesk']">
                            <Clock className="w-4 h-4 text-slate-500" />
                            {formatDate(project.expectedCompletion)}
                        </div>
                    </div>

                </div>

                {/* Contractor Info (If configured as public) */}
                {project.showContractor && project.contractor && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HardHat className="w-4 h-4 text-emerald-700" />
                            <span className="text-slate-600 font-medium">Executing Contractor:</span>
                            <strong className="text-slate-900 font-bold">{project.contractor}</strong>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-mono">Approved Firm</span>
                    </div>
                )}
            </div>

            {/* Progress Bar Section */}
            <div className="custom-card p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                    Construction Progress Overview
                </h2>

                <ProgressBar progress={project.currentProgress} size="lg" />
            </div>

            {/* Financial Overview (If configured as public) */}
            {project.showFinancialData && (
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                        Public Financial Utilization Summary
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-medium block">Allocated Budget</span>
                            <div className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                                {formatCurrency(project.allocatedBudget)}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-medium block">Amount Spent</span>
                            <div className="text-lg font-bold text-emerald-700 font-['Space_Grotesk']">
                                {formatCurrency(project.amountSpent)}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-medium block">Remaining Budget</span>
                            <div className="text-lg font-bold text-slate-700 font-['Space_Grotesk']">
                                {formatCurrency(project.remainingBudget)}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                            <span className="text-emerald-700 font-medium block">Fund Utilization</span>
                            <div className="text-lg font-extrabold text-emerald-800 font-['Space_Grotesk']">
                                {project.fundUtilization}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Issue CTA */}
            <div className="custom-card p-6 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">See an issue with this project?</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Report road damage, quality concerns, or delays directly to the PWD administration.</p>
                    </div>
                </div>
                <Link
                    to={`/public/submit-query?projectId=${project._id}`}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                >
                    Report an Issue
                </Link>
            </div>

        </div>
    );
}

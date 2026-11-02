import React, { useEffect, useState } from 'react';
import {
    ClipboardList, MapPin, Calendar, Clock, IndianRupee, Upload, Award,
    CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { getProjects } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function ContractorProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        getProjects()
            .then(res => setProjects(res.data))
            .catch(() => setError('Unable to load assigned projects.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner text="Loading your assigned projects..." />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    Road Construction Projects Directory
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Viewing all rural road construction projects across the department. You are signed in as <strong>{user?.name}</strong>. Click on any project to upload progress or view details.
                </p>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

            {projects.length === 0 && !error && (
                <div className="custom-card p-8 text-center text-slate-400 text-sm italic">
                    No road construction projects found.
                </div>
            )}

            <div className="space-y-4">
                {projects.map((project) => {
                    const isExpanded = expandedId === project._id;
                    const isCompleted = project.currentProgress >= 100 || project.status === 'Completed' || project.status === 'COMPLETED';

                    return (
                        <article key={project._id} className="custom-card overflow-hidden">
                            {/* Collapsed Header */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : project._id)}
                                className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">
                                            {project.projectId}
                                        </span>
                                        <StatusBadge status={project.status} />
                                        {isCompleted && (
                                            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Completed
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">{project.projectName}</h2>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        {project.village}, {project.district}, {project.state} — {project.roadLength} km
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400">Progress</div>
                                        <div className="text-lg font-extrabold text-emerald-700 font-['Space_Grotesk']">{project.currentProgress}%</div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/50">
                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-600">
                                            <span>Construction Progress</span>
                                            <strong className="text-emerald-700">{project.currentProgress}%</strong>
                                        </div>
                                        <ProgressBar progress={project.currentProgress} showDetails={false} />
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="flex items-center gap-1 text-slate-400 font-medium">
                                                <Calendar className="w-3.5 h-3.5" /> Start Date
                                            </div>
                                            <div className="font-bold text-slate-800">{formatDate(project.startDate) || 'Not Set'}</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="flex items-center gap-1 text-slate-400 font-medium">
                                                <Clock className="w-3.5 h-3.5" /> Expected Completion
                                            </div>
                                            <div className="font-bold text-slate-800">{formatDate(project.expectedCompletion) || 'Not Set'}</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="flex items-center gap-1 text-slate-400 font-medium">
                                                <IndianRupee className="w-3.5 h-3.5" /> Allocated Budget
                                            </div>
                                            <div className="font-bold text-slate-800">{formatCurrency(project.allocatedBudget)}</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="text-slate-400 font-medium">Amount Spent</div>
                                            <div className="font-bold text-emerald-700">{formatCurrency(project.amountSpent)}</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="text-slate-400 font-medium">Road Length</div>
                                            <div className="font-bold text-slate-800">{project.roadLength} km</div>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                                            <div className="text-slate-400 font-medium">State</div>
                                            <div className="font-bold text-slate-800">{project.state || 'Not Set'}</div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {project.description && (
                                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                                            <div className="text-slate-400 font-medium mb-1">Project Description</div>
                                            <p className="text-slate-700 leading-relaxed">{project.description}</p>
                                        </div>
                                    )}

                                    {/* Completion Evidence (if submitted) */}
                                    {project.completion?.completionPercentage && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                                            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                                <Award className="w-4 h-4" /> Completion Evidence Submitted
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-emerald-700 font-medium">Completion %</span>
                                                    <div className="font-bold text-emerald-900">{project.completion.completionPercentage}%</div>
                                                </div>
                                                <div>
                                                    <span className="text-emerald-700 font-medium">Completion Date</span>
                                                    <div className="font-bold text-emerald-900">{formatDate(project.completion.completionDate)}</div>
                                                </div>
                                            </div>
                                            {project.completion.completionDescription && (
                                                <p className="text-xs text-emerald-800">{project.completion.completionDescription}</p>
                                            )}
                                            {project.completion.completionImage && (
                                                <img
                                                    src={project.completion.completionImage}
                                                    alt="Completion evidence"
                                                    className="w-full max-h-56 object-cover rounded-xl border border-emerald-200"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-1">
                                        <Link
                                            to="/contractor/dashboard"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                                        >
                                            <Upload className="w-4 h-4" /> Update Progress
                                        </Link>
                                        {!isCompleted && (
                                            <Link
                                                to="/contractor/dashboard"
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                                            >
                                                <Award className="w-4 h-4" /> Submit Completion
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

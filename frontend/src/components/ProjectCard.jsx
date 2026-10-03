import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Calendar, ArrowRight, HardHat } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import { formatDate } from '../utils/formatters';

export default function ProjectCard({ project }) {
    return (
        <div className="custom-card custom-card-hover p-5 flex flex-col justify-between space-y-4">
            {/* Header Info */}
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {project.projectId}
                    </span>
                    <StatusBadge status={project.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                    <Link to={`/public/projects/${project._id || project.projectId}`}>
                        {project.projectName}
                    </Link>
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{project.village}, {project.district}, {project.state}</span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Road Length</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-slate-500" />
                        {project.roadLength} km
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Expected Completion</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatDate(project.expectedCompletion)}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">Construction Progress</span>
                <ProgressBar progress={project.currentProgress} />
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Public Portal Verification</span>
                <Link
                    to={`/public/projects/${project._id || project.projectId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { FileText, Printer, Download, HardHat, ShieldCheck } from 'lucide-react';
import { getProjects } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminReports() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('progress'); // 'progress' | 'financial'
    const [filterDistrict, setFilterDistrict] = useState('All');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const res = await getProjects();
                setProjects(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const filteredProjects = projects.filter(p =>
        filterDistrict === 'All' ? true : p.district === filterDistrict
    );

    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.allocatedBudget, 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + p.amountSpent, 0);

    if (loading) return <LoadingSpinner text="Generating official report layout..." />;

    return (
        <div className="space-y-6">

            {/* Controls Header (Hidden during print) */}
            <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        Official Monitoring & Audit Reports
                    </h1>
                    <p className="text-xs text-slate-500">
                        Generate printable executive progress reports and financial compliance summaries.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                        <option value="progress">Construction Progress Report</option>
                        <option value="financial">Financial Audit Report</option>
                    </select>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Printable Report Document Sheet */}
            <div className="custom-card p-8 bg-white space-y-6 border border-slate-300 shadow-lg text-slate-900">

                {/* Official Letterhead Header */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold">
                            <HardHat className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 uppercase font-['Space_Grotesk'] tracking-wide">
                                RuralConnect Infrastructure Telemetry
                            </h2>
                            <p className="text-xs text-slate-600 font-semibold">
                                Department of Rural Development & Public Works | State Division
                            </p>
                        </div>
                    </div>

                    <div className="text-right text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">Report Code: RC-RPT-{new Date().getFullYear()}</div>
                        <div className="text-slate-500">Generated: {formatDate(new Date())}</div>
                        <div className="text-emerald-700 font-mono text-[10px] font-bold">VERIFIED DATABASE RECORD</div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                    <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900 underline underline-offset-4 font-['Space_Grotesk']">
                        {reportType === 'progress' ? 'STATEWIDE RURAL ROAD CONSTRUCTION PROGRESS SUMMARY' : 'FINANCIAL ALLOCATION & UTILIZATION AUDIT REPORT'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        Total Projects Covered: <strong>{filteredProjects.length}</strong> | Total Capital Allocated: <strong>{formatCurrency(totalBudget)}</strong>
                    </p>
                </div>

                {/* Report Data Table */}
                <table className="w-full text-left border-collapse text-xs border border-slate-300">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                            <th className="p-2.5 border-r border-slate-300">Code</th>
                            <th className="p-2.5 border-r border-slate-300">Project Name</th>
                            <th className="p-2.5 border-r border-slate-300">Location</th>
                            <th className="p-2.5 border-r border-slate-300">Length</th>
                            {reportType === 'progress' ? (
                                <>
                                    <th className="p-2.5 border-r border-slate-300 text-center">Progress %</th>
                                    <th className="p-2.5 border-r border-slate-300">Expected End</th>
                                    <th className="p-2.5">Status</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-2.5 border-r border-slate-300 text-right">Budget (₹)</th>
                                    <th className="p-2.5 border-r border-slate-300 text-right">Spent (₹)</th>
                                    <th className="p-2.5 text-right">Utilization</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-medium text-[11px]">
                        {filteredProjects.map((p) => {
                            const util = p.allocatedBudget > 0 ? ((p.amountSpent / p.allocatedBudget) * 100).toFixed(1) : 0;
                            return (
                                <tr key={p._id} className="border-b border-slate-200">
                                    <td className="p-2.5 border-r border-slate-300 font-mono font-bold">{p.projectId}</td>
                                    <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-900">{p.projectName}</td>
                                    <td className="p-2.5 border-r border-slate-300 text-slate-700">{p.village}, {p.district}</td>
                                    <td className="p-2.5 border-r border-slate-300 font-mono">{p.roadLength} km</td>
                                    {reportType === 'progress' ? (
                                        <>
                                            <td className="p-2.5 border-r border-slate-300 text-center font-bold text-emerald-800">{p.currentProgress}%</td>
                                            <td className="p-2.5 border-r border-slate-300 text-slate-600">{formatDate(p.expectedCompletion)}</td>
                                            <td className="p-2.5"><StatusBadge status={p.status} /></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-2.5 border-r border-slate-300 text-right font-mono">{formatCurrency(p.allocatedBudget)}</td>
                                            <td className="p-2.5 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">{formatCurrency(p.amountSpent)}</td>
                                            <td className="p-2.5 text-right font-bold text-blue-700">{util}%</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Report Footer / Signature Block */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t border-slate-200 text-slate-700">
                    <div>
                        <p className="font-semibold">Prepared By:</p>
                        <p className="text-slate-500 font-mono text-[11px] mt-6">System Technical Auditor / Assistant Engineer</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Approved By:</p>
                        <p className="text-slate-500 font-mono text-[11px] mt-6">Chief Engineer, Rural Road Infrastructure</p>
                    </div>
                </div>

            </div>

        </div>
    );
}

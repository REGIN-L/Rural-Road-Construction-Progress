import React, { useEffect, useState } from 'react';
import { MessageSquare, Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, Send, MapPin, User, Calendar, Tag, X, Plus } from 'lucide-react';
import { getPublicQueries, updatePublicQueryStatus, respondToPublicQuery, convertQueryToProject } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

const STATUS_STYLES = {
    Submitted: { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
    Pending: { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
    'Under Review': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Eye },
    'In Progress': { bg: 'bg-violet-50 text-violet-800 border-violet-200', icon: RefreshCw },
    Resolved: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle },
    Rejected: { bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
};
const VALID_STATUSES = ['Submitted', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const QUERY_TYPES = ['All', 'Road Damage', 'Poor Construction Quality', 'Delayed Work', 'Drainage Problem', 'Safety Concern', 'Request New Road', 'Other'];

function StatusBadgeSmall({ status }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
    const Icon = style.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg}`}>
            <Icon className="w-3 h-3" />{status}
        </span>
    );
}

function QueryDetailModal({ query, onClose, onSave }) {
    const [status, setStatus] = useState(query.status);
    const [adminResponse, setAdminResponse] = useState(query.adminResponse || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Official Project Conversion
    const [showConvert, setShowConvert] = useState(false);
    const [convertData, setConvertData] = useState({
        projectId: `RC-${Date.now().toString().slice(-4)}`,
        projectName: query.roadName || `${query.location || query.village} Village Road`,
        roadLength: 5.0,
        allocatedBudget: 25000000,
        contractor: 'Unassigned Contractor'
    });
    const [converting, setConverting] = useState(false);

    const isRoadRequest = query.requestType === 'NEW_ROAD_REQUEST' || query.queryType === 'Request New Road';

    const handleSave = async () => {
        try {
            setSaving(true);
            await respondToPublicQuery(query._id, adminResponse, status);
            setSaved(true);
            setTimeout(() => { setSaved(false); onSave(); }, 1200);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save response.');
        } finally { setSaving(false); }
    };

    const handleCreateOfficialProject = async (e) => {
        e.preventDefault();
        try {
            setConverting(true);
            await convertQueryToProject(query._id, convertData);
            alert(`Official project created successfully! Query status marked as Resolved.`);
            onSave();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to convert query into official project.');
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
                            {isRoadRequest ? 'Road Project Proposal' : 'Citizen Grievance'}: {query.queryId}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{query.roadName || query.queryType} — {query.location || query.village}, {query.district}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Submitted By</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {query.name}</p>
                            {query.contactInfo && <p className="text-slate-500">{query.contactInfo}</p>}
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Location</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {query.location || query.village}</p>
                            <p className="text-slate-500">{query.district}, {query.state}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Submission Type</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-400" /> {isRoadRequest ? 'New Road Proposal' : query.queryType}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Submitted On</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(query.createdAt)}</p>
                        </div>
                    </div>

                    {query.projectId && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                            <span className="text-emerald-700 font-bold uppercase tracking-wide text-[10px]">Linked Project</span>
                            <p className="font-bold text-emerald-900">{query.projectId.projectName} ({query.projectId.projectId})</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description / Reason</h3>
                        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-4 leading-relaxed">{query.description}</p>
                    </div>

                    {query.image && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attached Photograph</h3>
                            <img src={query.image.startsWith('http') ? query.image : `http://localhost:5000${query.image}`} alt="Query evidence" className="w-full max-h-64 object-cover rounded-xl border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    )}

                    {/* Official Project Creation for Road Requests */}
                    {isRoadRequest && !query.isApprovedForProject && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-900">Approve & Sanction Official Project</h4>
                                    <p className="text-[11px] text-emerald-700">Admins can approve this public request and create a sanctioned construction project in the database.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowConvert(!showConvert)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                    {showConvert ? 'Hide' : 'Sanction Project'}
                                </button>
                            </div>

                            {showConvert && (
                                <form onSubmit={handleCreateOfficialProject} className="space-y-3 pt-2 text-xs border-t border-emerald-200">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-slate-700 font-semibold mb-1">Project ID</label>
                                            <input
                                                required
                                                value={convertData.projectId}
                                                onChange={e => setConvertData({ ...convertData, projectId: e.target.value })}
                                                className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-mono text-xs text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-700 font-semibold mb-1">Road Length (km)</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.1"
                                                value={convertData.roadLength}
                                                onChange={e => setConvertData({ ...convertData, roadLength: e.target.value })}
                                                className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Project Name</label>
                                        <input
                                            required
                                            value={convertData.projectName}
                                            onChange={e => setConvertData({ ...convertData, projectName: e.target.value })}
                                            className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-900"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-slate-700 font-semibold mb-1">Budget (₹)</label>
                                            <input
                                                required
                                                type="number"
                                                value={convertData.allocatedBudget}
                                                onChange={e => setConvertData({ ...convertData, allocatedBudget: e.target.value })}
                                                className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-700 font-semibold mb-1">Contractor</label>
                                            <input
                                                value={convertData.contractor}
                                                onChange={e => setConvertData({ ...convertData, contractor: e.target.value })}
                                                className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={converting}
                                        className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" /> {converting ? 'Creating Project...' : 'Create Official Project in MongoDB'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {query.isApprovedForProject && query.createdProjectId && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
                            ✓ Official project sanctioned and created: {query.createdProjectId.projectName} ({query.createdProjectId.projectId})
                        </div>
                    )}

                    <div className="border-t border-slate-200 pt-4 space-y-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Status Update & Official Response</h3>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Update Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Official Response to Citizen</label>
                            <textarea rows="4" value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} placeholder="Provide an official response to the citizen. This will be visible when they track their query..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleSave} disabled={saving || saved} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60">
                        {saved ? (<><CheckCircle className="w-3.5 h-3.5" /> Saved!</>) : saving ? 'Saving...' : (<><Send className="w-3.5 h-3.5" /> Save Response</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminPublicQueries() {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [alertMsg, setAlertMsg] = useState(null);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'All') params.status = statusFilter;
            if (typeFilter !== 'All') params.queryType = typeFilter;
            const res = await getPublicQueries(params);
            setQueries(res.data || []);
        } catch (err) {
            console.error('Failed to load public queries:', err);
            setAlertMsg({ type: 'error', text: 'Failed to load public queries.' });
        } finally { setLoading(false); }
    };

    useEffect(() => { loadQueries(); }, [statusFilter, typeFilter]);

    const filteredQueries = queries.filter(q =>
        search === '' ||
        (q.queryId || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.roadName || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.district || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleQuickStatus = async (query, newStatus) => {
        try {
            await updatePublicQueryStatus(query._id, newStatus, query.adminResponse);
            setAlertMsg({ type: 'success', text: `Query ${query.queryId} updated to "${newStatus}".` });
            loadQueries();
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Status update failed.' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-emerald-600" /> Public Queries &amp; Road Requests
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Review citizen grievances, road damage complaints, and requests for new village road projects.</p>
                </div>
                <button onClick={loadQueries} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {alertMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{alertMsg.text}</span>
                    <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="custom-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search by Query ID, citizen name, location, road name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            {QUERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Query Table */}
            {loading ? (
                <LoadingSpinner text="Loading public queries..." />
            ) : filteredQueries.length === 0 ? (
                <div className="custom-card p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">No queries found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="custom-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wide text-[10px]">
                                <tr>
                                    <th className="py-3 px-4">Query ID</th>
                                    <th className="py-3 px-4">Citizen</th>
                                    <th className="py-3 px-4">Type / Road Name</th>
                                    <th className="py-3 px-4">Location</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQueries.map(q => (
                                    <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                                            {q.queryId}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                                            {q.name}
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-slate-700">
                                            {q.roadName || q.queryType}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {q.location || q.village}, {q.district}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400">
                                            {formatDate(q.createdAt)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusBadgeSmall status={q.status} />
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedQuery(q)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedQuery && (
                <QueryDetailModal
                    query={selectedQuery}
                    onClose={() => setSelectedQuery(null)}
                    onSave={() => { setSelectedQuery(null); loadQueries(); }}
                />
            )}
        </div>
    );
}

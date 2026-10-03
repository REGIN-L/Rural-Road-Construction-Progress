import React, { useEffect, useState } from 'react';
import { MessageSquare, Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, Send, MapPin, User, Calendar, Tag, X } from 'lucide-react';
import { getPublicQueries, updatePublicQueryStatus, respondToPublicQuery } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

const STATUS_STYLES = {
    Pending: { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
    'Under Review': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Eye },
    'In Progress': { bg: 'bg-violet-50 text-violet-800 border-violet-200', icon: RefreshCw },
    Resolved: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle },
    Rejected: { bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
};
const VALID_STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const QUERY_TYPES = ['All', 'Road Damage', 'Fund Misuse', 'Incomplete Work', 'Project Delay', 'Quality Issue', 'Other'];

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

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-white font-['Space_Grotesk']">Query: {query.queryId}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{query.queryType} — {query.location}, {query.district}</p>
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
                            <p className="font-bold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {query.location}</p>
                            <p className="text-slate-500">{query.district}, {query.state}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Query Type</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-400" /> {query.queryType}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                            <span className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Submitted On</span>
                            <p className="font-bold text-slate-800 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(query.createdAt)}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Citizen Description</h3>
                        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-4 leading-relaxed">{query.description}</p>
                    </div>
                    {query.image && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attached Evidence</h3>
                            <img src={query.image.startsWith('http') ? query.image : `http://localhost:5000${query.image}`} alt="Query evidence" className="w-full max-h-64 object-cover rounded-xl border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    )}
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Admin Response &amp; Status Update</h3>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Update Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Admin Response</label>
                            <textarea rows="4" value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} placeholder="Provide a response to the citizen. This will be visible when they track their query..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
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

    if (loading) return <LoadingSpinner text="Loading citizen public queries..." />;

    const counts = {
        total: queries.length,
        pending: queries.filter(q => q.status === 'Pending').length,
        inProgress: queries.filter(q => ['Under Review', 'In Progress'].includes(q.status)).length,
        resolved: queries.filter(q => q.status === 'Resolved').length,
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-violet-600" /> Public Citizen Queries
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Review, respond to, and resolve road condition reports submitted by citizens.</p>
                </div>
                <button onClick={loadQueries} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Queries', value: counts.total, color: 'border-l-slate-600', text: 'text-slate-800' },
                    { label: 'Pending', value: counts.pending, color: 'border-l-amber-500', text: 'text-amber-700' },
                    { label: 'In Progress', value: counts.inProgress, color: 'border-l-blue-500', text: 'text-blue-700' },
                    { label: 'Resolved', value: counts.resolved, color: 'border-l-emerald-500', text: 'text-emerald-700' },
                ].map(stat => (
                    <div key={stat.label} className={`custom-card p-4 border-l-4 ${stat.color}`}>
                        <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
                        <p className={`text-2xl font-extrabold font-['Space_Grotesk'] ${stat.text}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {alertMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{alertMsg.text}</span>
                    <button onClick={() => setAlertMsg(null)} className="font-bold hover:underline cursor-pointer">Dismiss</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="custom-card p-2.5 flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="text" placeholder="Search by query ID, name, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-xs text-slate-900 focus:outline-none" />
                    {search && <button onClick={() => setSearch('')} className="cursor-pointer text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex items-center gap-2">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer">
                        {['All', ...VALID_STATUSES].map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                    </select>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer">
                        {QUERY_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                    </select>
                </div>
            </div>

            {filteredQueries.length === 0 ? (
                <div className="custom-card p-12 text-center space-y-3">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No queries found</p>
                    <p className="text-xs text-slate-500">No citizen queries match your current filter criteria.</p>
                </div>
            ) : (
                <div className="custom-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Query ID</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Citizen</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Type</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Location</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Status</th>
                                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Date</th>
                                    <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredQueries.map(q => (
                                    <tr key={q._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3"><span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{q.queryId}</span></td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800">{q.name}</p>
                                            {q.contactInfo && <p className="text-slate-400 text-[10px]">{q.contactInfo}</p>}
                                        </td>
                                        <td className="px-4 py-3"><span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded font-medium text-[10px]">{q.queryType}</span></td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <p>{q.location}</p>
                                            <p className="text-slate-400 text-[10px]">{q.district}, {q.state}</p>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadgeSmall status={q.status} /></td>
                                        <td className="px-4 py-3 text-slate-500">{formatDate(q.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {q.status === 'Pending' && (
                                                    <button onClick={() => handleQuickStatus(q, 'Under Review')} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold cursor-pointer transition-colors text-[10px]">Review</button>
                                                )}
                                                <button onClick={() => setSelectedQuery(q)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold cursor-pointer transition-colors">
                                                    <Eye className="w-3 h-3" /> View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">Showing {filteredQueries.length} of {queries.length} queries</div>
                </div>
            )}

            {selectedQuery && (
                <QueryDetailModal
                    query={selectedQuery}
                    onClose={() => setSelectedQuery(null)}
                    onSave={() => { setSelectedQuery(null); loadQueries(); setAlertMsg({ type: 'success', text: 'Query response saved successfully.' }); }}
                />
            )}
        </div>
    );
}
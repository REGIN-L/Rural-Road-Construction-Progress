import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, Clock, Eye, RefreshCw, XCircle, MapPin, User, Tag, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { getPublicQueryById } from '../services/projectService';

const STATUS_STYLES = {
    Pending: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: Clock, label: 'Pending Review' },
    'Under Review': { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: Eye, label: 'Under Review' },
    'In Progress': { bg: 'bg-violet-50 border-violet-200 text-violet-800', icon: RefreshCw, label: 'In Progress' },
    Resolved: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle, label: 'Resolved' },
    Rejected: { bg: 'bg-rose-50 border-rose-200 text-rose-800', icon: XCircle, label: 'Rejected' }
};

const STATUS_STEPS = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PublicQueryTrack() {
    const [searchParams] = useSearchParams();
    const [queryId, setQueryId] = useState(searchParams.get('id') || '');
    const [query, setQuery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const fetchQuery = async (idToSearch) => {
        const trimmed = (idToSearch || '').trim();
        if (!trimmed) {
            setError('Please enter a Query ID.');
            return;
        }
        try {
            setLoading(true);
            setError('');
            setQuery(null);
            setSearched(true);
            const res = await getPublicQueryById(trimmed);
            setQuery(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError(`No query found with ID "${trimmed}". Please check the ID and try again.`);
            } else {
                setError('Failed to fetch query. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const idParam = searchParams.get('id');
        if (idParam) {
            fetchQuery(idParam);
        }
    }, [searchParams]);

    const handleSearch = (e) => {
        e?.preventDefault();
        fetchQuery(queryId);
    };

    const statusStyle = query ? (STATUS_STYLES[query.status] || STATUS_STYLES.Pending) : null;
    const StatusIcon = statusStyle?.icon;
    const currentStep = STATUS_STEPS.indexOf(query?.status);

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
            <div className="space-y-2">
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">Track Your Query</h1>
                <p className="text-slate-500 text-sm">Enter your Query Reference ID to check the status of your submitted complaint.</p>
            </div>

            <form onSubmit={handleSearch} className="custom-card p-5 flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        value={queryId}
                        onChange={(e) => { setQueryId(e.target.value); setError(''); }}
                        placeholder="e.g. RCQ-2026-0001"
                        className="flex-1 bg-transparent py-3 text-sm text-slate-900 font-mono focus:outline-none"
                    />
                </div>
                <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-60 shrink-0">
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">{error}</div>
            )}

            {query && (
                <div className="space-y-5">
                    {/* Status Card */}
                    <div className={`custom-card p-6 border-2 ${statusStyle.bg} space-y-3`}>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-extrabold text-slate-700">{query.queryId}</span>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyle.bg}`}>
                                <StatusIcon className="w-4 h-4" /> {query.status}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{query.queryType}</h2>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {query.location}, {query.district}, {query.state}
                        </p>
                    </div>

                    {/* Progress Tracker */}
                    {query.status !== 'Rejected' && (
                        <div className="custom-card p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Progress</h3>
                            <div className="flex items-center gap-0">
                                {STATUS_STEPS.map((step, i) => {
                                    const isCompleted = currentStep >= i;
                                    const isCurrent = currentStep === i;
                                    return (
                                        <React.Fragment key={step}>
                                            <div className="flex flex-col items-center gap-1.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-400'} ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                                </div>
                                                <span className={`text-[10px] font-semibold text-center leading-tight ${isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>{step}</span>
                                            </div>
                                            {i < STATUS_STEPS.length - 1 && (
                                                <div className={`flex-1 h-0.5 mb-5 ${currentStep > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Detail Grid */}
                    <div className="custom-card p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Complaint Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-0.5">
                                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Submitted By</span>
                                <p className="font-semibold text-slate-800">{query.name}</p>
                                {query.contactInfo && <p className="text-slate-500">{query.contactInfo}</p>}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted On</span>
                                <p className="font-semibold text-slate-800">{formatDate(query.createdAt)}</p>
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1 mb-1.5"><MessageSquare className="w-3 h-3" /> Your Description</span>
                            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed">{query.description}</p>
                        </div>
                        {query.image && (
                            <div>
                                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide block mb-1.5">Attached Image</span>
                                <img src={query.image.startsWith('http') ? query.image : `http://localhost:5000${query.image}`} alt="Evidence" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                        )}
                    </div>

                    {/* Admin Response */}
                    {(query.adminResponse || query.status === 'Resolved' || query.status === 'Rejected') && (
                        <div className={`custom-card p-5 space-y-2 border-l-4 ${query.status === 'Resolved' ? 'border-l-emerald-500' : query.status === 'Rejected' ? 'border-l-rose-500' : 'border-l-blue-500'}`}>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Official Response from PWD Administration</h3>
                            {query.adminResponse ? (
                                <p className="text-sm text-slate-700 leading-relaxed">{query.adminResponse}</p>
                            ) : (
                                <p className="text-xs text-slate-400 italic">A response has not yet been provided. Please check back later.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!query && !loading && !error && !searched && (
                <div className="custom-card p-10 text-center space-y-3">
                    <Search className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-slate-700 font-bold">Enter your Query ID above</p>
                    <p className="text-xs text-slate-500">Your Query ID was provided when you submitted your complaint (format: RCQ-YYYY-XXXX)</p>
                    <Link to="/public/submit-query" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-2">
                        Submit a new complaint →
                    </Link>
                </div>
            )}
        </div>
    );
}
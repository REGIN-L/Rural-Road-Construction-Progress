import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, CheckCircle, MapPin, User, Tag, ArrowLeft } from 'lucide-react';
import { submitPublicQuery, getPublicProjects } from '../services/projectService';
import { states, districtsByState } from '../data/indiaLocations';

const QUERY_TYPES = ['Road Damage', 'Fund Misuse', 'Incomplete Work', 'Project Delay', 'Quality Issue', 'Other'];

export default function PublicQuerySubmit() {
    const [searchParams] = useSearchParams();
    const prefillProjectId = searchParams.get('projectId') || '';

    const [form, setForm] = useState({
        name: '',
        contactInfo: '',
        queryType: 'Road Damage',
        state: 'Tamil Nadu',
        district: districtsByState['Tamil Nadu']?.[0] || '',
        location: '',
        description: '',
        projectId: prefillProjectId
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        getPublicProjects().then(res => setProjects(res.data || [])).catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.queryType || !form.state || !form.district.trim() || !form.location.trim() || !form.description.trim()) {
            setError('Please fill in all required fields marked with *');
            return;
        }
        try {
            setSubmitting(true);
            const payload = { ...form };
            if (!payload.projectId) delete payload.projectId;
            const res = await submitPublicQuery(payload);
            setSubmitted(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit query. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">Query Submitted Successfully!</h1>
                    <p className="text-slate-500 text-sm">Your concern has been registered with the RuralConnect system. Use the reference ID below to track your query status.</p>
                </div>
                <div className="custom-card p-6 space-y-3 text-left">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Your Query Reference ID</p>
                        <div className="inline-block bg-emerald-50 border-2 border-emerald-300 rounded-xl px-6 py-3">
                            <span className="font-mono text-2xl font-extrabold text-emerald-800 tracking-widest">{submitted.queryId}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">Save this ID to track your query status anytime</p>
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div><span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Type</span>{submitted.queryType}</div>
                        <div><span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Status</span><span className="text-amber-700 font-bold">{submitted.status}</span></div>
                        <div><span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Location</span>{submitted.location}, {submitted.district}</div>
                        <div><span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Submitted By</span>{submitted.name}</div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={`/public/track-query?id=${submitted.queryId}`} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors">
                        Track My Query
                    </Link>
                    <Link to="/public/projects" className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors">
                        Browse Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            <div className="space-y-2">
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">Submit a Road Complaint</h1>
                <p className="text-slate-500 text-sm">Report road issues, fund misuse, or incomplete construction work to the PWD administration. All submissions are tracked and addressed.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" /> Your Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name <span className="text-rose-500">*</span></label>
                            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ramesh Kumar" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Contact Info <span className="text-slate-400 text-[10px]">(optional)</span></label>
                            <input name="contactInfo" value={form.contactInfo} onChange={handleChange} placeholder="Phone number or email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Query Details */}
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Tag className="w-4 h-4 text-violet-600" /> Complaint Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Query Type <span className="text-rose-500">*</span></label>
                            <select name="queryType" value={form.queryType} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                {QUERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Related Project <span className="text-slate-400 text-[10px]">(optional)</span></label>
                            <select name="projectId" value={form.projectId} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                                <option value="">-- Not linked to a specific project --</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.projectId} – {p.projectName}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Detailed Description <span className="text-rose-500">*</span></label>
                        <textarea name="description" value={form.description} onChange={handleChange} required rows="4" placeholder="Describe the issue in detail: what is the problem, how long has it been there, any safety concerns..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    </div>
                </div>

                {/* Location */}
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" /> Location Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">State <span className="text-rose-500">*</span></label>
                            <select
                                name="state"
                                value={form.state}
                                onChange={(e) => {
                                    const st = e.target.value;
                                    setForm(prev => ({
                                        ...prev,
                                        state: st,
                                        district: districtsByState[st]?.[0] || ''
                                    }));
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">District <span className="text-rose-500">*</span></label>
                            {districtsByState[form.state]?.length > 0 ? (
                                <select
                                    name="district"
                                    value={form.district}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    {districtsByState[form.state].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            ) : (
                                <input
                                    name="district"
                                    value={form.district}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Cuddalore"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Village / Location <span className="text-rose-500">*</span></label>
                            <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Neyveli Village Road" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Link to="/" className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm text-center transition-colors">Cancel</Link>
                    <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer">
                        <Send className="w-4 h-4" />
                        {submitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </div>
            </form>
        </div>
    );
}
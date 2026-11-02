import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, CheckCircle, MapPin, User, Tag, ArrowLeft, Plus, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { submitPublicQuery, getPublicProjects, uploadImage } from '../services/projectService';
import { states, districtsByState } from '../data/indiaLocations';

const FEEDBACK_CATEGORIES = [
    'Damaged Road',
    'Poor Construction Quality',
    'Delayed Work',
    'Drainage Problem',
    'Safety Concern',
    'Other'
];

export default function PublicQuerySubmit() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('type') === 'request' ? 'REQUEST' : 'FEEDBACK';
    const prefillProjectId = searchParams.get('projectId') || '';

    const [mode, setMode] = useState(initialMode); // 'FEEDBACK' or 'REQUEST'

    // Form state
    const [form, setForm] = useState({
        name: '',
        contactInfo: '',
        queryType: 'Damaged Road',
        requestType: initialMode === 'REQUEST' ? 'NEW_ROAD_REQUEST' : 'FEEDBACK',
        roadName: '',
        startPoint: '',
        endPoint: '',
        reason: '',
        urgency: 'Medium',
        state: 'Tamil Nadu',
        district: districtsByState['Tamil Nadu']?.[0] || 'Erode',
        location: '',
        village: '',
        description: '',
        projectId: prefillProjectId,
        image: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [error, setError] = useState('');
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        getPublicProjects().then(res => setProjects(res.data || [])).catch(() => {});
    }, []);

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setForm(prev => ({
            ...prev,
            requestType: newMode === 'REQUEST' ? 'NEW_ROAD_REQUEST' : 'FEEDBACK',
            queryType: newMode === 'REQUEST' ? 'Request New Road' : 'Damaged Road',
            projectId: newMode === 'REQUEST' ? '' : prefillProjectId
        }));
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'location' ? { village: value } : {}),
            ...(name === 'village' ? { location: value } : {})
        }));
        setError('');
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const data = await uploadImage(file);
            setForm(prev => ({ ...prev, image: data.imageUrl || data.url }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photograph');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim() || !form.district.trim() || !(form.location.trim() || form.village.trim()) || !form.description.trim()) {
            setError('Please fill in all required fields marked with *');
            return;
        }

        if (mode === 'REQUEST' && !form.roadName.trim()) {
            setError('Proposed road name is required for new road project requests');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...form,
                requestType: mode === 'REQUEST' ? 'NEW_ROAD_REQUEST' : 'FEEDBACK',
                queryType: mode === 'REQUEST' ? 'Request New Road' : form.queryType,
                village: form.village || form.location,
                location: form.location || form.village,
                priority: form.urgency
            };
            if (!payload.projectId) delete payload.projectId;

            const res = await submitPublicQuery(payload);
            setSubmitted(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit. Please check your network connection.');
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
                    <h1 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                        {submitted.requestType === 'NEW_ROAD_REQUEST' ? 'Road Request Registered Successfully!' : 'Feedback Submitted Successfully!'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {submitted.requestType === 'NEW_ROAD_REQUEST'
                            ? 'Your road construction proposal has been saved. It will be reviewed by the administration for feasibility and official project sanction.'
                            : 'Your road grievance has been registered. The divisional engineer has been notified.'}
                    </p>
                </div>
                <div className="custom-card p-6 space-y-3 text-left">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Your Reference Tracking ID</p>
                        <div className="inline-block bg-emerald-50 border-2 border-emerald-300 rounded-xl px-6 py-3">
                            <span className="font-mono text-2xl font-extrabold text-emerald-800 tracking-widest">{submitted.queryId}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">Save this Reference ID to track status anytime</p>
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                            <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Submission Type</span>
                            {submitted.requestType === 'NEW_ROAD_REQUEST' ? 'New Road Project Request' : submitted.queryType}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Status</span>
                            <span className="text-amber-700 font-bold">{submitted.status}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Location</span>
                            {submitted.location || submitted.village}, {submitted.district}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wide">Citizen</span>
                            {submitted.name}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={`/public/track-query?id=${submitted.queryId}`} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors">
                        Track Status
                    </Link>
                    <Link to="/public/projects" className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors">
                        Browse Projects Directory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            <div className="space-y-2">
                <Link to="/public/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                    Public Citizen Submission Portal
                </h1>
                <p className="text-slate-500 text-sm">
                    Submit localized road feedback, report defects, or propose a new village road construction project to the administration.
                </p>
            </div>

            {/* Mode Toggle Switch */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('FEEDBACK')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        mode === 'FEEDBACK'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Report Road Defect / Feedback
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('REQUEST')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        mode === 'REQUEST'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    Request a New Road Project
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Citizen Information */}
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" /> Citizen Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Your Full Name <span className="text-rose-500">*</span></label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Ramesh Kumar"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Contact Number / Email</label>
                            <input
                                name="contactInfo"
                                value={form.contactInfo}
                                onChange={handleChange}
                                placeholder="Phone number or email for status notifications"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Road / Query Details */}
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Tag className="w-4 h-4 text-violet-600" />
                        {mode === 'REQUEST' ? 'Proposed Road Project Details' : 'Feedback / Issue Details'}
                    </h2>

                    {mode === 'REQUEST' ? (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-1 block">Proposed Road Name / Description <span className="text-rose-500">*</span></label>
                                <input
                                    name="roadName"
                                    value={form.roadName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Thalavadi Tribal Link Road"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Starting Point (if known)</label>
                                    <input
                                        name="startPoint"
                                        value={form.startPoint}
                                        onChange={handleChange}
                                        placeholder="e.g. Thalavadi Main Bus Stop"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Ending Point (if known)</label>
                                    <input
                                        name="endPoint"
                                        value={form.endPoint}
                                        onChange={handleChange}
                                        placeholder="e.g. Primary Health Center Junction"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Reason for Request <span className="text-rose-500">*</span></label>
                                    <input
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Mud track washed out; cuts off school & clinic"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Urgency Level</label>
                                    <select
                                        name="urgency"
                                        value={form.urgency}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent (No Emergency Access)</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Feedback Category <span className="text-rose-500">*</span></label>
                                    <select
                                        name="queryType"
                                        value={form.queryType}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        {FEEDBACK_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Linked Official Project (optional)</label>
                                    <select
                                        name="projectId"
                                        value={form.projectId}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="">-- Not linked to a specific project --</option>
                                        {projects.map(p => <option key={p._id || p.projectId} value={p._id || p.projectId}>{p.projectId} – {p.projectName}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-1 block">Urgency Level</label>
                                <select
                                    name="urgency"
                                    value={form.urgency}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent (Safety Hazard)</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Detailed Description <span className="text-rose-500">*</span></label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            placeholder={mode === 'REQUEST' ? 'Provide details about the village community, estimated length, agricultural transport needs, and monsoon inaccessibility...' : 'Describe the issue clearly (potholes, missing gravel layer, drainage blockages, delayed contractor work)...'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
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
                                    placeholder="e.g. Erode"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Village / Area Name <span className="text-rose-500">*</span></label>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Thalavadi Hills"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Supporting Photograph Upload */}
                <div className="custom-card p-6 space-y-3">
                    <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-emerald-600" /> Optional Supporting Photograph
                    </h2>
                    <p className="text-xs text-slate-500">
                        Attach a photo of the damaged road, construction defect, or the current unpaved terrain.
                    </p>
                    <div className="flex items-center gap-3">
                        <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-2">
                            <UploadCloud className="w-4 h-4 text-emerald-700" />
                            {uploadingImage ? 'Uploading photograph…' : 'Choose Photograph'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        {form.image && (
                            <div className="flex items-center gap-2">
                                <img src={form.image} alt="Uploaded" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Link to="/public/projects" className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm text-center transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || uploadingImage}
                        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-900/20"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting
                            ? 'Submitting to Database...'
                            : (mode === 'REQUEST' ? 'Submit Road Project Request' : 'Submit Feedback / Grievance')}
                    </button>
                </div>
            </form>
        </div>
    );
}

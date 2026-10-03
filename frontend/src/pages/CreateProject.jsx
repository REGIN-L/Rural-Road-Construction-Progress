import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderPlus, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createProject } from '../services/projectService';
import { getUsers } from '../services/userService';
import { states, districtsByState } from '../data/indiaLocations';
import { useAuth } from '../hooks/useAuth';

export default function CreateProject() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const backUrl = user?.role === 'ENGINEER' ? '/engineer/projects' : '/admin/projects';
    const [engineers, setEngineers] = useState([]);

    const [form, setForm] = useState({
        projectId: `RC-00${Math.floor(10 + Math.random() * 90)}`,
        projectName: '',
        village: '',
        district: '',
        state: '',
        roadLength: '',
        allocatedBudget: '',
        amountSpent: '0',
        startDate: new Date().toISOString().split('T')[0],
        expectedCompletion: '',
        currentProgress: '0',
        contractor: '',
        description: '',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        publicDescription: '',
        assignedEngineer: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await getUsers();
                setEngineers(res.data.filter(u => u.role === 'ENGINEER' || u.role === 'ADMIN'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validations
        if (!form.state) {
            setError('Please select a state.');
            return;
        }

        if (!form.district) {
            setError('Please select a district.');
            return;
        }

        if (!form.projectId || !form.projectName || !form.village || !form.district || !form.roadLength || !form.allocatedBudget || !form.startDate || !form.expectedCompletion) {
            setError('Please fill in all required fields marked with *.');
            return;
        }

        if (Number(form.roadLength) <= 0) {
            setError('Road length must be greater than 0.');
            return;
        }

        if (Number(form.allocatedBudget) < 0) {
            setError('Allocated budget cannot be negative.');
            return;
        }

        if (Number(form.currentProgress) < 0 || Number(form.currentProgress) > 100) {
            setError('Current progress percentage must be between 0 and 100.');
            return;
        }

        if (new Date(form.expectedCompletion) <= new Date(form.startDate)) {
            setError('Expected completion date must be after the project start date.');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...form,
                roadLength: Number(form.roadLength),
                allocatedBudget: Number(form.allocatedBudget),
                amountSpent: Number(form.amountSpent) || 0,
                currentProgress: Number(form.currentProgress) || 0,
                publicDescription: form.publicDescription || form.description,
                assignedEngineer: form.assignedEngineer || null
            };

            await createProject(payload);
            navigate(backUrl);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create new road project.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link to={backUrl} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-emerald-600" />
                        Create New Rural Road Project
                    </h1>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="custom-card p-6 space-y-6 text-xs">

                {/* Section 1: Basic Identifiers */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                        1. Project Identification & Location
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Project ID (Unique Code) *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. RC-009"
                                value={form.projectId}
                                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Project / Road Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Erode – Perundurai Rural Link Road"
                                value={form.projectName}
                                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Village Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Perundurai"
                                value={form.village}
                                onChange={(e) => setForm({ ...form, village: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">State *</label>
                            <select
                                required
                                value={form.state}
                                onChange={(e) => setForm({ ...form, state: e.target.value, district: '' })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            >
                                <option value="">Select State</option>
                                {states.map((state) => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">District *</label>
                            <select
                                required
                                value={form.district}
                                disabled={!form.state}
                                onChange={(e) => setForm({ ...form, district: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none disabled:opacity-50"
                            >
                                <option value="">Select District</option>
                                {(districtsByState[form.state] || []).map((district) => <option key={district} value={district}>{district}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Technical & Financial Details */}
                <div className="space-y-4 pt-2">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                        2. Scope, Budget & Timelines
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Road Length (Km) *</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                placeholder="e.g. 8.5"
                                value={form.roadLength}
                                onChange={(e) => setForm({ ...form, roadLength: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Allocated Budget (₹ INR) *</label>
                            <input
                                type="number"
                                required
                                placeholder="e.g. 42500000 (for ₹4.25 Cr)"
                                value={form.allocatedBudget}
                                onChange={(e) => setForm({ ...form, allocatedBudget: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Initial Amount Spent (₹)</label>
                            <input
                                type="number"
                                value={form.amountSpent}
                                onChange={(e) => setForm({ ...form, amountSpent: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Start Date *</label>
                            <input
                                type="date"
                                required
                                value={form.startDate}
                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Expected Completion Date *</label>
                            <input
                                type="date"
                                required
                                value={form.expectedCompletion}
                                onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Initial Progress (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.currentProgress}
                                onChange={(e) => setForm({ ...form, currentProgress: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Contractor & Assigned Engineer */}
                <div className="space-y-4 pt-2">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                        3. Stakeholders & Assignment
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Contractor Firm Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Kongu Construction Works"
                                value={form.contractor}
                                onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Assign Assistant Engineer</label>
                            <select
                                value={form.assignedEngineer}
                                onChange={(e) => setForm({ ...form, assignedEngineer: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                            >
                                <option value="">-- Unassigned Engineer --</option>
                                {engineers.map(e => (
                                    <option key={e._id} value={e._id}>{e.name} ({e.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 4: Public Visibility Controls */}
                <div className="space-y-4 pt-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-900 text-sm">
                        4. Public Dashboard Visibility Settings
                    </h3>

                    <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-emerald-200">
                        <div>
                            <span className="font-bold text-slate-900 block">Show on Public Dashboard</span>
                            <span className="text-slate-500 text-[11px]">When ON, citizens can view this project on the public homepage.</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={form.isPublic}
                            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                            className="w-5 h-5 accent-emerald-600 cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-700 font-medium">Show Contractor to Public</span>
                            <input
                                type="checkbox"
                                checked={form.showContractor}
                                onChange={(e) => setForm({ ...form, showContractor: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-700 font-medium">Show Financial Data to Public</span>
                            <input
                                type="checkbox"
                                checked={form.showFinancialData}
                                onChange={(e) => setForm({ ...form, showFinancialData: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <Link
                        to="/admin/projects"
                        className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> Save Project to Database
                    </button>
                </div>

            </form>

        </div>
    );
}

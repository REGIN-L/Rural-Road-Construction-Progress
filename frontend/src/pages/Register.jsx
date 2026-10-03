import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardHat, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('ENGINEER');
    const [adminSetupKey, setAdminSetupKey] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all required registration fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify your password entry.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            setLoading(true);
            const res = await register({ name, email, password, role, adminSetupKey });

            const destinations = {
                ADMIN: '/admin/dashboard',
                ENGINEER: '/engineer/dashboard',
                CONTRACTOR: '/contractor/dashboard'
            };
            navigate(destinations[res.user.role] || '/login');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. User email may already exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Inter',sans-serif]">
            <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-2xl text-slate-900">

                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/30">
                            <HardHat className="w-6 h-6" />
                        </div>
                        <span className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                            Rural<span className="text-emerald-600">Connect</span>
                        </span>
                    </Link>
                    <h2 className="text-base font-bold text-slate-800">
                        Create Authorized Account
                    </h2>
                    <p className="text-xs text-slate-500">
                        Register as an Engineer official
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Full Name:</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Er. Rajesh Kumar"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Official Email Address:</label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. rajesh@ruralconnect.gov.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Account Type:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        >
                            <option value="ENGINEER">Engineer</option>
                            <option value="CONTRACTOR">Contractor</option>
                            <option value="ADMIN">Administrator (setup key required)</option>
                        </select>
                    </div>

                    {role === 'ADMIN' && (
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Administrator Setup Key:</label>
                            <input
                                type="password"
                                required
                                value={adminSetupKey}
                                onChange={(e) => setAdminSetupKey(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Password:</label>
                        <input
                            type="password"
                            required
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Confirm Password:</label>
                        <input
                            type="password"
                            required
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" /> Complete Registration
                            </>
                        )}
                    </button>

                </form>

                <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                        Login Here
                    </Link>
                </div>

            </div>
        </div>
    );
}

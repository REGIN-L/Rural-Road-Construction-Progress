import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardHat, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [expectedRole, setExpectedRole] = useState('ADMIN');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email address and password.');
            return;
        }

        try {
            setLoading(true);
            const res = await login({ email, password });

            if (res.user.role !== expectedRole) {
                throw new Error(`This account is registered as ${res.user.role}. Select the matching portal or update the MongoDB role.`);
            }

            const destinations = {
                ADMIN: '/admin/dashboard',
                ENGINEER: '/engineer/dashboard',
                CONTRACTOR: '/contractor/dashboard'
            };
            navigate(destinations[res.user.role] || '/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Invalid email or password. Please try again.');
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
                        Official Portal Authentication
                    </h2>
                    <p className="text-xs text-slate-500">
                        Sign in to the portal assigned to your account role
                    </p>
                </div>

                <select
                    value={expectedRole}
                    onChange={(e) => setExpectedRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs font-semibold"
                >
                    <option value="ADMIN">Administrator</option>
                    <option value="ENGINEER">Engineer</option>
                    <option value="CONTRACTOR">Contractor</option>
                </select>

                {/* Error Message Alert */}
                {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Email Address:</label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. admin@ruralconnect.gov.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Password:</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-10 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" /> Login to Dashboard
                            </>
                        )}
                    </button>

                </form>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <Link to="/" className="hover:text-slate-900 font-medium transition-colors">
                        ← Public Homepage
                    </Link>
                    <Link to="/register" className="text-emerald-700 hover:underline font-bold">
                        Register New User →
                    </Link>
                </div>

            </div>
        </div>
    );
}

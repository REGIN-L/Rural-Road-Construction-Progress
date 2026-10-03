import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HardHat, LogIn, Menu, X, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/public/projects' },
        { name: 'Report Issue', path: '/public/submit-query' },
        { name: 'Track Query', path: '/public/track-query' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' }
    ];

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                            <HardHat className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-slate-900 block leading-none">
                                Rural<span className="text-emerald-700">Connect</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                                Rural Road Construction Monitoring System
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive(link.path)
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Action Button */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <Link
                                to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'CONTRACTOR' ? '/contractor/dashboard' : '/engineer/dashboard'}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
                            >
                                <Shield className="w-4 h-4" />
                                {user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'CONTRACTOR' ? 'Contractor Portal' : 'Engineer Portal'}
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                            >
                                <LogIn className="w-4 h-4 text-emerald-400" />
                                Portal Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Panel */}
            {mobileMenuOpen && (
                <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-base font-semibold ${isActive(link.path) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                        {user ? (
                            <Link
                                to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'CONTRACTOR' ? '/contractor/dashboard' : '/engineer/dashboard'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm"
                            >
                                <LogIn className="w-4 h-4" /> Admin Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

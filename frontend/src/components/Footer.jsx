import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                                <HardHat className="w-4 h-4" />
                            </div>
                            <span className="font-['Space_Grotesk'] text-base font-bold text-white">
                                RuralConnect
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                            A transparent Rural Road Construction Monitoring and Fund Utilization System empowering government administrators, project engineers, and public citizens with verified road progress tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white text-sm mb-3">Public Access</h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/" className="hover:text-white transition-colors">Public Home</Link></li>
                            <li><Link to="/public/projects" className="hover:text-white transition-colors">Public Project Directory</Link></li>
                            <li><Link to="/about" className="hover:text-white transition-colors">About RuralConnect</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white text-sm mb-3">Official Portal</h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Admin & Engineer Login</Link></li>
                            <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Register Account</Link></li>
                            <li className="pt-2 text-slate-500">Department of Rural Development & PWD</li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
                    <div>
                        © {new Date().getFullYear()} RuralConnect. College Project Implementation.
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                        <span>Built for Transparent Infrastructure Monitoring</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
            </div>
        </footer>
    );
}

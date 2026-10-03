import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { HardHat } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function EngineerLayout() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex bg-slate-100 text-slate-900 font-['Inter',sans-serif]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Engineer Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-600" />
                        <h1 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                            Engineer Project Telemetry Portal
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">Engineer: <strong>{user?.name}</strong></span>
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-300">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                    </div>
                </header>

                {/* Content Viewport */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}

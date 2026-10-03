import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ContractorLayout() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex bg-slate-100 text-slate-900 font-['Inter',sans-serif]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="w-5 h-5 text-blue-600" />
                        <h1 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                            Contractor Project Portal
                        </h1>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                        Contractor: <strong>{user?.name}</strong>
                    </span>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    IndianRupee,
    FileText,
    Users,
    LogOut,
    HardHat,
    UserCheck,
    Globe,
    Trash2,
    MessageSquare,
    PlusCircle,
    Award,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const adminNav = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
        { name: 'Add Project', path: '/admin/projects/create', icon: PlusCircle },
        { name: 'Public Queries', path: '/admin/public-queries', icon: MessageSquare },
        { name: 'Deletion Requests', path: '/admin/deletion-requests', icon: Trash2 },
        { name: 'Funds', path: '/admin/funds', icon: IndianRupee },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
        { name: 'Users', path: '/admin/users', icon: Users }
    ];

    const engineerNav = [
        { name: 'Dashboard', path: '/engineer/dashboard', icon: LayoutDashboard },
        { name: 'Projects', path: '/engineer/projects', icon: FolderKanban },
        { name: 'Add Project', path: '/engineer/projects/create', icon: PlusCircle },
        { name: 'My Deletion Requests', path: '/engineer/deletion-requests', icon: Trash2 }
    ];

    const contractorNav = [
        { name: 'Dashboard', path: '/contractor/dashboard', icon: LayoutDashboard },
        { name: 'Assigned Projects', path: '/contractor/projects', icon: ClipboardList },
        { name: 'Completion Updates', path: '/contractor/completions', icon: Award }
    ];

    const navItems = user?.role === 'ADMIN' ? adminNav : user?.role === 'CONTRACTOR' ? contractorNav : engineerNav;

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">

            {/* Top Brand Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/30">
                        <HardHat className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-['Space_Grotesk'] text-base font-bold text-white block leading-none">
                            Rural<span className="text-emerald-400">Connect</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                            {user?.role || 'PORTAL'}
                        </span>
                    </div>
                </Link>
            </div>

            {/* User Info Card */}
            <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Logged in as:</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-2 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${active
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Actions */}
            <div className="p-3 border-t border-slate-800 space-y-2">
                <Link
                    to="/public/projects"
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" /> Public View
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Live</span>
                </Link>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                </button>
            </div>

        </aside>
    );
}

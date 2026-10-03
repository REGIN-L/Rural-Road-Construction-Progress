import React, { useEffect, useState } from 'react';
import { Users, UserCheck, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { getUsers, updateUserRole, deleteUser } from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to change user role.');
        }
    };

    const handleDeleteUser = async (userId, name) => {
        if (window.confirm(`Are you sure you want to remove user "${name}"?`)) {
            try {
                await deleteUser(userId);
                setUsers(users.filter(u => u._id !== userId));
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete user.');
            }
        }
    };

    if (loading) return <LoadingSpinner text="Loading system user accounts..." />;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    System User Access Management
                </h1>
                <p className="text-xs text-slate-500">
                    Manage official administrator and engineer accounts, assign roles, and audit registration dates.
                </p>
            </div>

            {/* Users Table */}
            <div className="custom-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                <th className="p-3.5">User Name</th>
                                <th className="p-3.5">Official Email</th>
                                <th className="p-3.5">Role</th>
                                <th className="p-3.5">Registered Date</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-slate-50/80">
                                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                                            {u.name.charAt(0)}
                                        </div>
                                        {u.name}
                                    </td>
                                    <td className="p-3.5 text-slate-600 font-mono">{u.email}</td>
                                    <td className="p-3.5">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border cursor-pointer ${u.role === 'ADMIN'
                                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                                }`}
                                        >
                                            <option value="ENGINEER">ENGINEER</option>
                                            <option value="CONTRACTOR">CONTRACTOR</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td className="p-3.5 text-slate-400 text-[11px]">{formatDate(u.createdAt)}</td>
                                    <td className="p-3.5 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(u._id, u.name)}
                                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

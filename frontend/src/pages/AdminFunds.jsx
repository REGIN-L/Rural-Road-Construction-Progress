import React, { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, PieChart as PieIcon, Building2 } from 'lucide-react';
import { getProjects } from '../services/projectService';
import { getExpenses } from '../services/expenseService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

export default function AdminFunds() {
    const [projects, setProjects] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projRes, expRes] = await Promise.all([
                    getProjects(),
                    getExpenses()
                ]);
                setProjects(projRes.data);
                setExpenses(expRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner text="Compiling financial utilization audit from MongoDB..." />;

    const totalBudget = projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.amountSpent, 0);
    const remainingFunds = Math.max(0, totalBudget - totalSpent);
    const overallUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

    // Category breakdown
    const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    return (
        <div className="space-y-6">

            {/* Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                    Statewide Financial & Fund Utilization Audit
                </h1>
                <p className="text-xs text-slate-500">
                    Transparent monitoring of public road expenditure, category allocations, and project budget balance.
                </p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

                <div className="custom-card p-5 space-y-1 border-l-4 border-l-slate-800 bg-slate-900 text-white">
                    <span className="text-[11px] text-slate-400 font-medium">Total Allocated Capital</span>
                    <div className="text-2xl font-extrabold font-['Space_Grotesk']">
                        {formatCurrency(totalBudget)}
                    </div>
                    <span className="text-[10px] text-slate-400">Approved Public Monies</span>
                </div>

                <div className="custom-card p-5 space-y-1 border-l-4 border-l-emerald-600 bg-emerald-950/80 border-emerald-800 text-white">
                    <span className="text-[11px] text-emerald-400 font-medium">Total Capital Spent</span>
                    <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-emerald-300">
                        {formatCurrency(totalSpent)}
                    </div>
                    <span className="text-[10px] text-emerald-400">Verified Disbursements</span>
                </div>

                <div className="custom-card p-5 space-y-1 border-l-4 border-l-blue-600">
                    <span className="text-[11px] text-slate-500 font-medium">Unspent Balance</span>
                    <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-slate-900">
                        {formatCurrency(remainingFunds)}
                    </div>
                    <span className="text-[10px] text-slate-400">Available Treasury Monies</span>
                </div>

                <div className="custom-card p-5 space-y-1 border-l-4 border-l-teal-600">
                    <span className="text-[11px] text-teal-800 font-semibold">Statewide Utilization Rate</span>
                    <div className="text-2xl font-extrabold font-['Space_Grotesk'] text-teal-700">
                        {overallUtilization}%
                    </div>
                    <span className="text-[10px] text-slate-400">Cumulative Expenditure Ratio</span>
                </div>

            </div>

            {/* Category Breakdown */}
            <div className="custom-card p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                    Expenditure Breakdown by Category
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    {['Materials', 'Labour', 'Equipment', 'Transportation', 'Miscellaneous'].map(cat => (
                        <div key={cat} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-slate-500 font-medium block">{cat}</span>
                            <div className="text-base font-bold text-slate-900 font-mono">
                                {formatCurrency(categoryTotals[cat] || 0)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Financial Utilization Table */}
            <div className="custom-card overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm font-['Space_Grotesk']">
                    Project-Wise Financial Utilization Matrix
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                <th className="p-3.5">ID</th>
                                <th className="p-3.5">Project Name</th>
                                <th className="p-3.5">District</th>
                                <th className="p-3.5 text-right">Allocated Budget</th>
                                <th className="p-3.5 text-right">Amount Spent</th>
                                <th className="p-3.5 text-right">Remaining Funds</th>
                                <th className="p-3.5 text-right">Utilization Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {projects.map(p => {
                                const rem = Math.max(0, p.allocatedBudget - p.amountSpent);
                                const rate = p.allocatedBudget > 0 ? ((p.amountSpent / p.allocatedBudget) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={p._id} className="hover:bg-slate-50/80">
                                        <td className="p-3.5 font-mono font-bold text-emerald-800">{p.projectId}</td>
                                        <td className="p-3.5 font-bold text-slate-900">{p.projectName}</td>
                                        <td className="p-3.5 text-slate-500">{p.district}</td>
                                        <td className="p-3.5 text-right font-mono font-semibold">{formatCurrency(p.allocatedBudget)}</td>
                                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.amountSpent)}</td>
                                        <td className="p-3.5 text-right font-mono text-slate-600">{formatCurrency(rem)}</td>
                                        <td className="p-3.5 text-right font-extrabold text-blue-600">{rate}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

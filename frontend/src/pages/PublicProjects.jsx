import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, FolderX } from 'lucide-react';
import { searchPublicProjects, getPublicProjects } from '../services/projectService';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PublicProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [minProgress, setMinProgress] = useState(0);

    // Unique Districts list for dropdown
    const [districtsList, setDistrictsList] = useState([]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery.trim()) params.query = searchQuery.trim();
            if (selectedDistrict !== 'All') params.district = selectedDistrict;
            if (selectedStatus !== 'All') params.status = selectedStatus;
            if (minProgress > 0) params.minProgress = minProgress;

            const res = await searchPublicProjects(params);
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to search public projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch to extract districts
        const init = async () => {
            try {
                const res = await getPublicProjects();
                setProjects(res.data);
                const dists = Array.from(new Set(res.data.map(p => p.district))).sort();
                setDistrictsList(dists);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadProjects();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedDistrict, selectedStatus, minProgress]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedDistrict('All');
        setSelectedStatus('All');
        setMinProgress(0);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                    Approved Public Rural Road Projects
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                    Browse verified construction projects, track road completion progress, and view transparent public records.
                </p>
            </div>

            {/* Search & Filter Bar Box */}
            <div className="custom-card p-5 space-y-4">

                {/* Search Input */}
                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Search by project name, village, district or project ID (e.g. Erode, RC-001)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                    {/* District Filter */}
                    <div>
                        <label className="block text-slate-500 font-semibold mb-1">Filter by District:</label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium focus:outline-none"
                        >
                            <option value="All">All Districts</option>
                            {districtsList.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-slate-500 font-semibold mb-1">Project Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium focus:outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="ON_TRACK">On Track</option>
                            <option value="DELAYED">Delayed</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Progress Slider */}
                    <div>
                        <label className="block text-slate-500 font-semibold mb-1">
                            Min Progress: <span className="text-emerald-700 font-bold">{minProgress}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={minProgress}
                            onChange={(e) => setMinProgress(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer"
                        />
                    </div>

                    {/* Reset Filters */}
                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
                        </button>
                    </div>

                </div>

            </div>

            {/* Projects Grid */}
            {loading ? (
                <LoadingSpinner text="Searching public projects matching criteria..." />
            ) : projects.length === 0 ? (
                <div className="custom-card p-12 text-center space-y-3">
                    <FolderX className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Approved Public Projects Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Try resetting search filters or search for another village, district, or project code.
                    </p>
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs cursor-pointer"
                    >
                        Clear Search Query
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((p) => (
                        <ProjectCard key={p._id || p.projectId} project={p} />
                    ))}
                </div>
            )}

        </div>
    );
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import EngineerLayout from './layouts/EngineerLayout';
import ContractorLayout from './layouts/ContractorLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Public Pages
import PublicHome from './pages/PublicHome';
import PublicProjects from './pages/PublicProjects';
import PublicProjectDetails from './pages/PublicProjectDetails';
import PublicAbout from './pages/PublicAbout';
import PublicContact from './pages/PublicContact';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/AdminProjects';
import CreateProject from './pages/CreateProject';
import AdminProjectDetails from './pages/AdminProjectDetails';
import AdminFunds from './pages/AdminFunds';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminDeletionRequests from './pages/AdminDeletionRequests';
import AdminPublicQueries from './pages/AdminPublicQueries';

// Engineer Pages
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerProjects from './pages/EngineerProjects';
import EngineerDeletionRequests from './pages/EngineerDeletionRequests';
import ContractorDashboard from './pages/ContractorDashboard';

// Public Query Pages
import PublicQuerySubmit from './pages/PublicQuerySubmit';
import PublicQueryTrack from './pages/PublicQueryTrack';

function DashboardRedirect() {
    const { user } = useAuth();
    const destinations = {
        ADMIN: '/admin/dashboard',
        ENGINEER: '/engineer/dashboard',
        CONTRACTOR: '/contractor/dashboard'
    };
    return <Navigate to={destinations[user?.role] || '/login'} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>

                {/* Public Routes */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<PublicHome />} />
                    <Route path="public/projects" element={<PublicProjects />} />
                    <Route path="public/projects/:id" element={<PublicProjectDetails />} />
                    <Route path="about" element={<PublicAbout />} />
                    <Route path="contact" element={<PublicContact />} />
                    <Route path="public/submit-query" element={<PublicQuerySubmit />} />
                    <Route path="public/track-query" element={<PublicQueryTrack />} />
                </Route>

                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER', 'CONTRACTOR']} />}>
                    <Route path="/dashboard" element={<DashboardRedirect />} />
                </Route>

                {/* Protected Admin Portal */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="projects/create" element={<CreateProject />} />
                        <Route path="projects/:id" element={<AdminProjectDetails />} />
                        <Route path="funds" element={<AdminFunds />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="deletion-requests" element={<AdminDeletionRequests />} />
                        <Route path="public-queries" element={<AdminPublicQueries />} />
                    </Route>
                </Route>

                {/* Protected Engineer Portal */}
                <Route element={<ProtectedRoute allowedRoles={['ENGINEER', 'ADMIN']} />}>
                    <Route path="/engineer" element={<EngineerLayout />}>
                        <Route index element={<Navigate to="/engineer/dashboard" replace />} />
                        <Route path="dashboard" element={<EngineerDashboard />} />
                        <Route path="projects" element={<EngineerProjects />} />
                        <Route path="deletion-requests" element={<EngineerDeletionRequests />} />
                        <Route path="projects/create" element={<CreateProject />} />
                    </Route>
                </Route>

                {/* Protected Contractor Portal */}
                <Route element={<ProtectedRoute allowedRoles={['CONTRACTOR']} />}>
                    <Route path="/contractor" element={<ContractorLayout />}>
                        <Route index element={<Navigate to="/contractor/dashboard" replace />} />
                        <Route path="dashboard" element={<ContractorDashboard />} />
                    </Route>
                </Route>

                {/* Catch-all redirect to homepage */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </AuthProvider>
    );
}

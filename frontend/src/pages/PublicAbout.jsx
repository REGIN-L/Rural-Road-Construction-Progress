import React from 'react';
import { HardHat, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PublicAbout() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                    About RuralConnect
                </h1>
                <p className="text-slate-500 text-sm">
                    Rural Road Construction Monitoring and Fund Utilization System
                </p>
            </div>

            <div className="custom-card p-6 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <h2 className="text-base font-bold text-slate-900">Project Mission</h2>
                <p>
                    RuralConnect is a web-based portal engineered to monitor rural road infrastructure development and financial utilization transparently across Panchayats, Blocks, and Districts.
                </p>

                <h2 className="text-base font-bold text-slate-900 pt-2">Key Operational Objectives</h2>
                <ul className="list-disc list-inside space-y-2">
                    <li>Enable unauthenticated public citizens to verify approved rural road construction progress and status without requiring registration.</li>
                    <li>Provide Assistant Engineers and Field Supervisors with a direct telemetry interface to log construction updates, phase milestones, and project expenses.</li>
                    <li>Empower Central and State Administrators with full governance control over public visibility, project lifecycle management, user permissions, and financial audits.</li>
                </ul>
            </div>
        </div>
    );
}

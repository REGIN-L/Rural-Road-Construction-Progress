import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Send, Search } from "lucide-react";

export default function PublicContact() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 font-[Space_Grotesk]">
                    Contact & Support Portal
                </h1>
                <p className="text-slate-500 text-sm">
                    Get in touch with the Department of Rural Infrastructure & PWD Technical Cell
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900">Headquarters Address</h2>
                    <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Public Works Department (PWD) Complex, Block 4, Secretariat, Chennai, Tamil Nadu - 600009</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>1800-425-9900 (Toll Free Public Helpline)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>support@ruralconnect.gov.in</span>
                        </div>
                    </div>
                </div>
                <div className="custom-card p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900">Public Citizen Query Portal</h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Citizens can report road damage, fund misuse, incomplete construction, or project delays. All queries are officially tracked and responded to by the PWD Administration.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/public/submit-query"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
                        >
                            <Send className="w-4 h-4" /> Submit a Road Complaint
                        </Link>
                        <Link
                            to="/public/track-query"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                        >
                            <Search className="w-4 h-4" /> Track Your Query Status
                        </Link>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">
                        You will receive a reference ID after submission to track your query.
                    </p>
                </div>
            </div>
        </div>
    );
}
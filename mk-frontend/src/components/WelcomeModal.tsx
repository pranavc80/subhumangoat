'use client';

import { useState } from 'react';
import { CgClose, CgArrowRight, CgShield, CgData, CgGlobeAlt } from 'react-icons/cg';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in duration-300">

                {/* Header Image / Pattern */}
                <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
                    {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div> */}
                    <div className="absolute bottom-4 left-6">
                        <h2 className="text-4xl font-bold text-white tracking-tight">Welcome to Cognisphere</h2>
                        <p className="text-blue-100 text-sm">Real-time Storm Monitoring.</p>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg h-fit">
                                <CgGlobeAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Interactive Map</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                    Explore real-time weather stations in your area. The application shows localized rainfall intensity at a glance.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1 p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg h-fit">
                                <CgData className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Live Monitoring</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                    Click any station to view detailed metrics like rainfall rate, duration, and storm severity classification.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4 leading-relaxed">
                            By using this application, you accept all weather data will be collected to improve our monitoring system.
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto group flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all cursor-pointer shadow-lg "
                            >
                                Get Started
                                <CgArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

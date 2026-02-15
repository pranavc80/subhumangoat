'use client';

import { useState, useEffect } from 'react';
import { X, Monitor, Bell, CheckCircle, Mail, Globe, Shield, Database } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'general' | 'notifications' | 'data';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    // Notification state
    const [email, setEmail] = useState('');
    const [saved, setSaved] = useState(false);

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSaveEmail = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock save
        console.log('Saving email:', email);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
            onClick={handleBackdropClick}
        >
            <div className="w-full h-full md:h-[600px] md:max-w-4xl bg-white dark:bg-[#1e1e1e] md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border-0 md:border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-sans transition-colors duration-300">

                {/* Mobile Header with Close Button */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e1e1e]">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mobile Tab Navigation */}
                <div className="md:hidden flex border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#171717] overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general'
                            ? 'text-slate-900 dark:text-white border-b-2 border-blue-500 bg-white dark:bg-[#1e1e1e]'
                            : 'text-slate-500 dark:text-gray-400'
                            }`}
                    >
                        <Monitor className="w-4 h-4" />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'notifications'
                            ? 'text-slate-900 dark:text-white border-b-2 border-blue-500 bg-white dark:bg-[#1e1e1e]'
                            : 'text-slate-500 dark:text-gray-400'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'data'
                            ? 'text-slate-900 dark:text-white border-b-2 border-blue-500 bg-white dark:bg-[#1e1e1e]'
                            : 'text-slate-500 dark:text-gray-400'
                            }`}
                    >
                        <Database className="w-4 h-4" />
                        Data Collection
                    </button>
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-64 bg-gray-50 dark:bg-[#171717] p-4 flex-col border-r border-gray-200 dark:border-white/5 transition-colors duration-300">
                    <div className="mb-6 px-2">
                        <h2 className="text-sm font-medium text-slate-500 dark:text-gray-400">Cognisphere Settings</h2>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'general'
                                ? 'bg-gray-200 dark:bg-[#2f2f2f] text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <Monitor className="w-4 h-4" />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'notifications'
                                ? 'bg-gray-200 dark:bg-[#2f2f2f] text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <Bell className="w-4 h-4" />
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'data'
                                ? 'bg-gray-200 dark:bg-[#2f2f2f] text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <Database className="w-4 h-4" />
                            Data Collection
                        </button>


                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] transition-colors duration-300 overflow-hidden">
                    {/* Desktop Header */}
                    <div className="hidden md:flex h-16 items-center justify-between px-8 border-b border-gray-200 dark:border-white/5">
                        <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                            {activeTab === 'general' ? 'General' : activeTab === 'notifications' ? 'Notifications' : 'Data Collection'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        {activeTab === 'general' && (
                            <div className="space-y-6 md:space-y-8 max-w-2xl">
                                <section className="space-y-3 md:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-200">Theme</label>
                                        <div className="text-sm text-slate-600 dark:text-gray-400">
                                            Automatically follows your system settings
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-500">
                                        Cognisphere&apos;s theme adapts to your device&apos;s light or dark mode preference.
                                    </p>
                                </section>

                                <div className="h-px bg-gray-200 dark:bg-white/5" />

                                <section className="space-y-3 md:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-200">Clear Cache</label>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3f3f3f] text-slate-900 dark:text-white text-xs font-medium rounded-lg border border-gray-200 dark:border-white/5 transition-colors"
                                        >
                                            Reload App
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-500">
                                        Troubleshooting issues? Try reloading the application to clear temporary data.
                                    </p>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 md:space-y-8 max-w-2xl">
                                <section className="space-y-3 md:space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-slate-700 dark:text-gray-200">Email Alerts</h3>
                                        <p className="text-xs text-slate-500 dark:text-gray-500">
                                            Receive notifications when storm severity reaches critical levels.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSaveEmail} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-xs font-medium text-slate-500 dark:text-gray-400">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500" />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#2f2f2f] border border-gray-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-200">
                                            <p className="font-medium mb-1">Alert Triggers:</p>
                                            <ul className="list-disc list-inside space-y-0.5 text-blue-600/70 dark:text-blue-200/70">
                                                <li>High Priority Storms ({'>'} 2.73&quot;/hr)</li>
                                                <li>Emergency Events ({'>'} 3.57&quot;/hr)</li>
                                            </ul>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2
                                                    ${saved
                                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/50'
                                                        : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200'
                                                    }
                                                `}
                                            >
                                                {saved ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Saved
                                                    </>
                                                ) : (
                                                    'Save Preferences'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </section>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6 md:space-y-8 max-w-2xl">
                                <section className="space-y-3 md:space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-slate-700 dark:text-gray-200">Data Collection & Privacy</h3>
                                        <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">
                                            Cognisphere collects weather information from specific stations to build and improve our storm prediction models.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                                                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">What we collect</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    We aggregate real-time rainfall intensity, duration, and storm severity metrics from local weather stations. This data is used solely for meteorological analysis and improving early warning systems.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                                                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Prediction Modeling</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    The collected data helps train our machine learning models to better predict flash floods and severe storm events in the area.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

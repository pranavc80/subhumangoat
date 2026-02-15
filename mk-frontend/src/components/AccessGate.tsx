
'use client';

import { useState, useEffect } from 'react';
import { Shield, ChevronRight } from 'lucide-react';

interface AccessGateProps {
    onAuthorized: () => void;
}

export default function AccessGate({ onAuthorized }: AccessGateProps) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/v1/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (response.ok) {
                localStorage.setItem('cognisphere-authorized', 'true');
                onAuthorized();
            } else {
                setError('Invalid access code. Please try again.');
            }
        } catch (err) {
            setError('System error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white dark:bg-[#0f172a] p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6">
                        <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Cognisphere Access</h1>
                    <p className="text-slate-500 dark:text-slate-400">Please enter your authorization code to proceed.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Authorization Code"
                            className={`w-full bg-slate-100 dark:bg-slate-800/50 border-2 rounded-xl px-5 py-4 text-lg outline-none transition-all 
                                ${error ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-transparent focus:border-blue-500'}`}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-medium px-2 animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !code}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Verifying...' : 'Access Cognisphere'}
                        {!isLoading && <ChevronRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
                        McKinney Storm Monitoring System
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';

interface IngestFormProps {
    stationId: string;
    onIngest: () => void;
}

export default function IngestForm({ stationId, onIngest }: IngestFormProps) {
    const [inches, setInches] = useState('');
    const [apiKey, setApiKey] = useState('test-key');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:3000/api/v1/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey,
                },
                body: JSON.stringify({
                    stationId,
                    inches: parseFloat(inches),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to ingest data');
            }

            setMessage({ text: 'Data ingested successfully', type: 'success' });
            setInches('');
            onIngest(); // Refresh parent
        } catch (err) {
            setMessage({ text: err instanceof Error ? err.message : 'Failed to ingest', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel rounded-2xl p-8 transition-all hover:border-slate-600/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-slate-200">
                <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </span>
                Data Simulation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">API Key</label>
                    <div className="relative">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Secret Key"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-slate-200 placeholder-slate-600"
                        />
                        <div className="absolute right-3 top-3 text-slate-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Rainfall Amount</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={inches}
                            onChange={(e) => setInches(e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-slate-200 placeholder-slate-600 font-mono"
                        />
                        <div className="absolute right-4 top-3 text-slate-500 text-sm font-medium">inches</div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>Simulate Rainfall</span>
                        </>
                    )}
                </button>

                {message && (
                    <div className={`text-sm p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/10 text-green-400 border border-green-900/20' : 'bg-red-900/10 text-red-400 border border-red-900/20'}`}>
                        {message.type === 'success' ? (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}

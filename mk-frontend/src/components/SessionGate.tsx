
'use client';

import { useState, useEffect } from "react";
import AccessGate from "@/components/AccessGate";

export default function SessionGate({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const authorized = localStorage.getItem('cognisphere-authorized') === 'true';
        setIsAuthorized(authorized);
    }, []);

    if (isAuthorized === null) {
        return <div className="min-h-screen bg-white dark:bg-[#0f172a]" />;
    }

    if (!isAuthorized) {
        return <AccessGate onAuthorized={() => setIsAuthorized(true)} />;
    }

    return <>{children}</>;
}

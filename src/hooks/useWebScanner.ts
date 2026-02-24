import { useState, useCallback } from 'react';
import { performWebScan, WebScanResult } from '@/services/web-scanner';

export type WebScanStatus = 'idle' | 'scanning' | 'completed' | 'error';

export interface WebScanStage {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
}

const STAGES: WebScanStage[] = [
    {
        id: 'headers',
        name: 'Analyzing Security Headers',
        description: 'Checking CSP, HSTS, X-Frame-Options, and other security headers',
        status: 'pending',
        progress: 0,
    },
    {
        id: 'certificates',
        name: 'Checking SSL Certificates',
        description: 'Retrieving certificate transparency logs',
        status: 'pending',
        progress: 0,
    },
];

export function useWebScanner() {
    const [status, setStatus] = useState<WebScanStatus>('idle');
    const [stages, setStages] = useState<WebScanStage[]>(STAGES);
    const [currentStage, setCurrentStage] = useState(0);
    const [result, setResult] = useState<WebScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const updateStage = useCallback((index: number, updates: Partial<WebScanStage>) => {
        setStages(prev => prev.map((stage, i) =>
            i === index ? { ...stage, ...updates } : stage
        ));
    }, []);

    const scan = useCallback(async (url: string) => {
        setStatus('scanning');
        setStages(STAGES.map(s => ({ ...s, status: 'pending', progress: 0 })));
        setCurrentStage(0);
        setError(null);
        setResult(null);

        try {
            // Perform scan with progress updates
            const scanResult = await performWebScan(url, (stageIndex, progress) => {
                setCurrentStage(stageIndex);

                // Update current stage progress
                updateStage(stageIndex, {
                    status: progress < 100 ? 'running' : 'completed',
                    progress
                });

                // Mark previous stages as completed
                for (let i = 0; i < stageIndex; i++) {
                    updateStage(i, { status: 'completed', progress: 100 });
                }
            });

            // Mark all stages as completed
            setStages(prev => prev.map(s => ({ ...s, status: 'completed', progress: 100 })));

            setResult(scanResult);
            setStatus('completed');
            setCurrentStage(STAGES.length);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(message);
            setStatus('error');

            setStages(prev => prev.map((stage, i) =>
                i === currentStage ? { ...stage, status: 'error' } : stage
            ));
        }
    }, [currentStage, updateStage]);

    const reset = useCallback(() => {
        setStatus('idle');
        setStages(STAGES.map(s => ({ ...s, status: 'pending', progress: 0 })));
        setCurrentStage(0);
        setResult(null);
        setError(null);
    }, []);

    return {
        status,
        stages,
        currentStage,
        result,
        error,
        scan,
        reset,
    };
}

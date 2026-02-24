import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

interface TerminalLogsProps {
    logs: string[];
    className?: string;
}

export function TerminalLogs({ logs, className }: TerminalLogsProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [internalLogs, setInternalLogs] = useState<string[]>([]);

    // Effect to slowly append logs or just sync them
    useEffect(() => {
        setInternalLogs(logs);
    }, [logs]);

    // Auto scroll
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [internalLogs]);

    return (
        <div className={cn(
            "font-mono text-xs p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-y-auto custom-scrollbar shadow-inner shadow-black/50",
            className
        )}>
            <div className="flex flex-col gap-1">
                {internalLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-slate-400">
                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className={cn(
                            "text-slate-300",
                            log.includes('Error') && "text-red-400",
                            log.includes('Completed') && "text-green-400",
                            log.includes('Scanning') && "text-cyan-400"
                        )}>
                            {'>'} {log}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

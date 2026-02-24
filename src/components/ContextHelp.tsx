import { cn } from '@/utils/cn';

interface ContextHelpProps {
    label: string;
    value?: string | number;
    onAsk: (question: string) => void;
    className?: string;
    context?: string; // Optional targeted context
}

export function ContextHelp({ label, value, onAsk, className, context }: ContextHelpProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const basePrompt = `Explain "${label}" with value "${value}" in cybersecurity context.`;
        const fullPrompt = context ? `${basePrompt} Data: ${context}` : basePrompt;
        onAsk(fullPrompt);
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-600 text-slate-500 text-[10px] hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-help",
                className
            )}
            title="Ask Brain to explain"
        >
            ?
        </button>
    );
}

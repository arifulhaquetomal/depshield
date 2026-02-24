import { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Certificate } from '@/services/web-scanner';

interface DomainMapProps {
    domain: string;
    certificates: Certificate[];
}

export function DomainMap({ domain, certificates }: DomainMapProps) {
    const graphRef = useRef<any>();

    // Build graph data from certificates
    const graphData = {
        nodes: [
            { id: domain, name: domain, level: 0, isRoot: true },
            ...certificates.slice(0, 15).map((cert, i) => ({
                id: cert.name_value,
                name: cert.name_value,
                level: 1,
                isRoot: false,
            })),
        ],
        links: certificates.slice(0, 15).map(cert => ({
            source: domain,
            target: cert.name_value,
        })),
    };

    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.d3Force('charge').strength(-100);
            graphRef.current.d3Force('link').distance(50);
        }
    }, []);

    const getNodeColor = (node: any) => {
        if (node.isRoot) return '#06b6d4'; // cyan for root
        if (node.name.startsWith('*.')) return '#8b5cf6'; // purple for wildcards
        return '#3b82f6'; // blue for subdomains
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 font-mono uppercase text-sm">
                <span className="text-cyan-500">::</span> Domain Map
            </h3>
            <div className="h-[400px] bg-slate-900/50 rounded-lg relative overflow-hidden">
                {certificates.length > 0 ? (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        backgroundColor="#0f172a00"
                        nodeRelSize={6}
                        nodeLabel="name"
                        nodeColor={getNodeColor}
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.name;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px monospace`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = getNodeColor(node);
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, node.isRoot ? 8 : 5, 0, 2 * Math.PI, false);
                            ctx.fill();

                            if (globalScale > 1) {
                                ctx.fillStyle = '#94a3b8';
                                ctx.fillText(label, node.x, node.y + 15);
                            }
                        }}
                        linkColor={() => '#334155'}
                        linkWidth={1}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleWidth={2}
                        linkDirectionalParticleSpeed={0.002}
                        enableNodeDrag={true}
                        enableZoomInteraction={true}
                        enablePanInteraction={true}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        No certificate data available
                    </div>
                )}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Root Domain</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Wildcard</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Subdomain</span>
                </div>
            </div>
        </div>
    );
}

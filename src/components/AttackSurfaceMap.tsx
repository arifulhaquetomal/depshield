import { useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { DependencyRisk } from '@/types';

interface AttackSurfaceMapProps {
    dependencies: DependencyRisk[];
}

export function AttackSurfaceMap({ dependencies }: AttackSurfaceMapProps) {
    const fgRef = useRef<any>();

    const data = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];
        const nodeMap = new Set<string>();

        // Add root node
        nodes.push({
            id: 'root',
            name: 'Project Root',
            val: 20,
            color: '#ffffff',
            risk: 'root'
        });
        nodeMap.add('root');

        dependencies.forEach(dep => {
            const id = `${dep.dependency.name}@${dep.dependency.version}`;

            if (!nodeMap.has(id)) {
                let color = '#4ade80'; // Low - Green
                let val = 5;

                if (dep.riskLevel === 'Critical') {
                    color = '#ef4444'; // Red
                    val = 15;
                } else if (dep.riskLevel === 'High') {
                    color = '#f97316'; // Orange
                    val = 10;
                } else if (dep.riskLevel === 'Medium') {
                    color = '#eab308'; // Yellow
                    val = 7;
                }

                nodes.push({
                    id,
                    name: dep.dependency.name,
                    val,
                    color,
                    risk: dep.riskLevel,
                    version: dep.dependency.version
                });
                nodeMap.add(id);
            }

            // Link to root mainly for direct deps, but for now flat linking to root for simplicity 
            // since we don't have the full tree structure in the flat list.
            // Ideally we would have parent-child info. 
            // Assuming 'isTransitive' creates a vague hierarchy for visual effect.

            if (!dep.dependency.isTransitive) {
                links.push({ source: 'root', target: id });
            } else {
                // For transitive, we ideally attach to their parent, but we don't have that info in the flat list easily.
                // We'll attach to a random direct dep or just leaves for "effect" if we can't find parent.
                // To avoid detached nodes, we'll attach to root but with longer distance if possible, 
                // OR effectively, we can just link everything to root if we lack hierarchy.
                // BETTER: Let's just link all to root for star topology if hierarchy is missing,
                // BUT to look "cool", we might want to fake some structure or just show the flat list.
                // Let's stick to star topology for now as safe default.
                links.push({ source: 'root', target: id });
            }
        });

        return { nodes, links };
    }, [dependencies]);

    return (
        <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50 h-[400px] relative group">
            <div className="absolute top-4 left-4 z-10 pointers-events-none">
                <h3 className="text-slate-200 font-bold bg-slate-900/80 px-2 py-1 rounded">Attack Surface Map</h3>
                <p className="text-xs text-slate-400 bg-slate-900/80 px-2 rounded">Visual Dependency Graph</p>
            </div>

            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                nodeColor="color"
                nodeRelSize={6}
                linkColor={() => 'rgba(255,255,255,0.1)'}
                backgroundColor="rgba(0,0,0,0)"
                d3VelocityDecay={0.1}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current?.zoomToFit(400)}
            />
        </div>
    );
}

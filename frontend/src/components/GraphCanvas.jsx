import { useState, useEffect, useRef } from 'react';

// Interactive Force-Directed Canvas component using React state and requestAnimationFrame
export default function GraphCanvas({ data, onNodeClick, selectedNode }) {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Parse input data and assign starting position on canvas
  useEffect(() => {
    if (!data.nodes || data.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const width = 800;
    const height = 600;

    const parsedNodes = data.nodes.map((n, idx) => {
      // Find existing coordinates to prevent layout reset on simple updates
      const existing = nodes.find(prevNode => prevNode.id === n.id);
      if (existing) {
        return { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
      }

      // Circle layout initialization
      const angle = (idx / data.nodes.length) * 2 * Math.PI;
      const radius = 180 + Math.random() * 50;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    setNodes(parsedNodes);
    setEdges(data.edges || []);
  }, [data]);

  // Force-directed simulation loops using requestAnimationFrame
  useEffect(() => {
    if (nodes.length === 0) return;

    let animFrame;
    const width = 800;
    const height = 600;
    const kRepulsion = 1600; // Repelling force between nodes
    const kAttraction = 0.08; // Spring constant along edges
    const centerGravity = 0.02; // Pulls nodes back to center

    const tick = () => {
      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(n => ({ ...n, fx: 0, fy: 0 }));

        // 1. Repulsion between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          const n1 = nextNodes[i];
          if (!n1) continue;
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n2 = nextNodes[j];
            if (!n2) continue;
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);

            if (dist < 250) {
              const force = kRepulsion / distSq;
              const fX = (dx / dist) * force;
              const fY = (dy / dist) * force;

              n1.fx += fX;
              n1.fy += fY;
              n2.fx -= fX;
              n2.fy -= fY;
            }
          }
        }

        // 2. Link Attraction along edges
        edges.forEach(edge => {
          const sNode = nextNodes.find(n => n.id === edge.source);
          const tNode = nextNodes.find(n => n.id === edge.target);

          if (sNode && tNode) {
            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = kAttraction * (dist - 120); // Rest length 120

            const fX = (dx / dist) * force;
            const fY = (dy / dist) * force;

            sNode.fx += fX;
            sNode.fy += fY;
            tNode.fx -= fX;
            tNode.fy -= fY;
          }
        });

        // 3. Gravity pulling toward center
        nextNodes.forEach(node => {
          if (node.id === draggedNode) return;
          const dx = width / 2 - node.x;
          const dy = height / 2 - node.y;
          node.fx += dx * centerGravity;
          node.fy += dy * centerGravity;
        });

        // 4. Update velocity and position dampening
        return nextNodes.map(node => {
          if (node.id === draggedNode) return node;

          node.vx = (node.vx + node.fx) * 0.82;
          node.vy = (node.vy + node.fy) * 0.82;

          return {
            ...node,
            x: Math.max(40, Math.min(width - 40, node.x + node.vx)),
            y: Math.max(40, Math.min(height - 40, node.y + node.vy))
          };
        });
      });

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [edges, draggedNode]);

  // Mouse Handlers for Dragging and Canvas Panning
  const handleMouseDown = (node, e) => {
    e.stopPropagation();
    setDraggedNode(node.id);
    hasDraggedRef.current = false;
  };

  const handleCanvasMouseDown = (e) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (draggedNode) {
      hasDraggedRef.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Compensate for zoom & pan offset
      const x = (clientX - pan.x) / zoom;
      const y = (clientY - pan.y) / zoom;

      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x, y, vx: 0, vy: 0 } : n));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  // Node Color scheme mapper
  const getNodeColor = (type) => {
    switch (type) {
      case 'Person': return '#3b82f6';
      case 'Company': return '#a855f7';
      case 'Interest': return '#10b981';
      case 'Community': return '#ec4899';
      case 'City': return '#f59e0b';
      case 'Skill': return '#06b6d4';
      default: return '#94a3b8';
    }
  };

  // Human readable relationship naming adapter
  const formatRelType = (type) => {
    switch (type) {
      case 'WORKS_AT': return 'Works at';
      case 'HAS_INTEREST': return 'Interested in';
      case 'HAS_SKILL': return 'Skilled in';
      case 'LIVES_IN': return 'Lives in';
      case 'MEMBER_OF': return 'Member of';
      case 'KNOWS': return 'Knows';
      default: return type;
    }
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: draggedNode ? 'grabbing' : (isPanning ? 'grabbing' : 'grab') 
      }} 
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleMouseUp} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom HUD */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}>Zoom +</button>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>Zoom -</button>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset View</button>
      </div>

      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 600" 
        style={{ background: '#f8fafc' }}
        onWheel={(e) => {
          e.preventDefault();
          const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
          setZoom(z => Math.min(2.5, Math.max(0.4, z * zoomFactor)));
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render Relationships (Edges) */}
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;

            const isHighlighted = hoveredNode === null || hoveredNode === edge.source || hoveredNode === edge.target;

            return (
              <g key={edge.id} style={{ opacity: isHighlighted ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                <line 
                  x1={source.x} 
                  y1={source.y} 
                  x2={target.x} 
                  y2={target.y} 
                  stroke="#cbd5e1" 
                  strokeWidth={selectedNode?.id === edge.source || selectedNode?.id === edge.target ? "2" : "1.2"}
                  strokeDasharray={selectedNode?.id === edge.source || selectedNode?.id === edge.target ? "none" : "none"} 
                />
                <text 
                  x={(source.x + target.x) / 2} 
                  y={(source.y + target.y) / 2 - 4} 
                  fill="var(--text-secondary)" 
                  fontSize="7px" 
                  textAnchor="middle"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {formatRelType(edge.type)}
                </text>
              </g>
            );
          })}

          {/* Render Entity Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const isHighlighted = hoveredNode === null || hoveredNode === node.id || edges.some(e => (e.source === node.id && e.target === hoveredNode) || (e.target === node.id && e.source === hoveredNode));

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(node, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasDraggedRef.current) {
                    onNodeClick(node);
                  }
                }}
                style={{ opacity: isHighlighted ? 1 : 0.2, transition: 'opacity 0.25s' }}
              >
                <circle 
                  r={node.type === 'Person' ? 14 : 10} 
                  fill={getNodeColor(node.type)} 
                  stroke={isSelected ? "var(--sidebar-active)" : "#ffffff"} 
                  strokeWidth={isSelected ? "3" : "1.5"} 
                  style={{ 
                    filter: (hoveredNode === node.id || isSelected) 
                      ? `drop-shadow(0 0 6px ${getNodeColor(node.type)})` 
                      : 'none' 
                  }}
                />
                <text 
                  y={node.type === 'Person' ? 24 : 20} 
                  fill={isSelected ? "var(--sidebar-active)" : "var(--text-primary)"} 
                  fontSize="9px" 
                  fontWeight={isSelected ? "700" : "600"} 
                  textAnchor="middle"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

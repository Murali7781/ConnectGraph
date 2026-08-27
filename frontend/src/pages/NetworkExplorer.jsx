import { useState, useEffect } from 'react';
import GraphCanvas from '../components/GraphCanvas';

export default function NetworkExplorer({
  graphData,
  graphLoading,
  graphError,
  graphFilterType, setGraphFilterType,
  graphFilterId, setGraphFilterId,
  people,
  interests,
  onOpenProfile,
  API_BASE
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetailsPeople, setNodeDetailsPeople] = useState([]);
  const [nodeDetailsLoading, setNodeDetailsLoading] = useState(false);

  // Checkboxes state matching Mockup 4 (visual only filters for canvas render nodes)
  const [showNodeTypes, setShowNodeTypes] = useState({
    People: true,
    Interests: true,
    Skills: true,
    Companies: true,
    Communities: true,
    Cities: true
  });

  const handleToggleNodeType = (type) => {
    setShowNodeTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleResetFilters = () => {
    setGraphFilterType('all');
    setGraphFilterId('');
    setShowNodeTypes({
      People: true,
      Interests: true,
      Skills: true,
      Companies: true,
      Communities: true,
      Cities: true
    });
  };

  // Filter graphData locally based on checkboxes before passing to canvas
  const getFilteredGraphData = () => {
    if (!graphData.nodes) return { nodes: [], edges: [] };
    
    const allowedTypes = [];
    if (showNodeTypes.People) allowedTypes.push('Person');
    if (showNodeTypes.Interests) allowedTypes.push('Interest');
    if (showNodeTypes.Skills) allowedTypes.push('Skill');
    if (showNodeTypes.Companies) allowedTypes.push('Company');
    if (showNodeTypes.Communities) allowedTypes.push('Community');
    if (showNodeTypes.Cities) allowedTypes.push('City');

    const filteredNodes = graphData.nodes.filter(n => allowedTypes.includes(n.type));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    const filteredEdges = (graphData.edges || []).filter(e => 
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  };

  // Load connected people dynamically using existing REST API queries
  useEffect(() => {
    if (!selectedNode) return;
    setNodeDetailsPeople([]);
    
    if (selectedNode.type === 'Person') {
      setNodeDetailsLoading(true);
      fetch(`${API_BASE}/people/${selectedNode.id}`)
        .then(res => res.json())
        .then(data => {
          const mapped = (data.connections || []).map(c => ({
            id: c.id,
            name: c.name,
            role: c.role || 'Connection',
            company: c.company || '',
            city: c.city || '',
            relationship: c.relType
          }));
          setNodeDetailsPeople(mapped);
          setNodeDetailsLoading(false);
        })
        .catch(() => setNodeDetailsLoading(false));
    } else {
      let queryParam = '';
      if (selectedNode.type === 'Company') queryParam = `company=${encodeURIComponent(selectedNode.label)}`;
      else if (selectedNode.type === 'Skill') queryParam = `skill=${encodeURIComponent(selectedNode.label)}`;
      else if (selectedNode.type === 'Interest') queryParam = `interest=${encodeURIComponent(selectedNode.label)}`;
      else if (selectedNode.type === 'Community') queryParam = `community=${encodeURIComponent(selectedNode.label)}`;
      else if (selectedNode.type === 'City') queryParam = `city=${encodeURIComponent(selectedNode.label)}`;
      
      if (queryParam) {
        setNodeDetailsLoading(true);
        fetch(`${API_BASE}/people?${queryParam}`)
          .then(res => res.json())
          .then(data => {
            setNodeDetailsPeople(data || []);
            setNodeDetailsLoading(false)
          })
          .catch(() => setNodeDetailsLoading(false));
      }
    }
  }, [selectedNode, API_BASE]);

  // Clean selected details if layout focus updates
  useEffect(() => {
    setSelectedNode(null);
  }, [graphFilterType, graphFilterId]);

  const filteredData = getFilteredGraphData();

  return (
    <div className="graph-explorer-layout animate-fade-in">
      {/* Left Explorer controls sidebar - Mockup 4 */}
      <div className="panel" style={{ width: '280px', flexShrink: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0', fontSize: '15px', fontWeight: '600' }}>Search & Filter</h3>
          <button 
            className="btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '10px', background: 'transparent' }}
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>

        {/* Focus selector */}
        <div className="form-group">
          <label>View Focus</label>
          <select 
            value={graphFilterType} 
            onChange={e => {
              setGraphFilterType(e.target.value);
              setGraphFilterId('');
            }}
            style={{ fontSize: '12px' }}
          >
            <option value="all">Whole Network (Subset)</option>
            <option value="person">Ego-Network of Person</option>
            <option value="interest">Subnetwork of Interest</option>
          </select>
        </div>

        {graphFilterType === 'person' && (
          <div className="form-group animate-fade-in">
            <label>Select Person</label>
            <select value={graphFilterId} onChange={e => setGraphFilterId(e.target.value)} style={{ fontSize: '12px' }}>
              <option value="">-- Select --</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {graphFilterType === 'interest' && (
          <div className="form-group animate-fade-in">
            <label>Select Interest</label>
            <select value={graphFilterId} onChange={e => setGraphFilterId(e.target.value)} style={{ fontSize: '12px' }}>
              <option value="">-- Select --</option>
              {interests.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Node types checkbox selectors - Mockup 4 */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Node Types</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            {Object.keys(showNodeTypes).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showNodeTypes[type]} 
                  onChange={() => handleToggleNodeType(type)}
                  style={{ width: '14px', height: '14px' }}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color key guide */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>🔵 Person</div>
            <div>🏢 Company</div>
            <div>🎯 Interest</div>
            <div>💖 Community</div>
            <div>📍 City</div>
            <div>🌐 Skill</div>
          </div>
        </div>
      </div>

      {/* Graph display canvas panel */}
      <div style={{ flexGrow: 1, display: 'flex', gap: '16px', height: '600px' }}>
        <div className="panel" style={{ flexGrow: 1, padding: '0', position: 'relative', overflow: 'hidden' }}>
          {graphLoading ? (
            <div className="graph-overlay-status">
              Fetching network graph...
            </div>
          ) : graphError ? (
            <div className="graph-overlay-status text-red">
              ⚠️ {graphError}
            </div>
          ) : (
            <GraphCanvas 
              data={filteredData} 
              selectedNode={selectedNode}
              onNodeClick={(node) => setSelectedNode(node)} 
            />
          )}
        </div>

        {/* Collapsible details sidebar */}
        <div 
          className="panel" 
          style={{ 
            width: selectedNode ? '320px' : '0px', 
            opacity: selectedNode ? 1 : 0, 
            padding: selectedNode ? '20px' : '0px',
            overflow: 'hidden', 
            transition: 'all 0.3s ease',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {selectedNode && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {selectedNode.type} Node
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {selectedNode.label}
                  </h3>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </button>
              </div>

              <div style={{ flexGrow: 1, overflowY: 'auto' }} className="node-details-body">
                {selectedNode.type === 'Person' && (
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px' }}>
                      {selectedNode.properties?.bio}
                    </p>
                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', marginBottom: '20px', fontSize: '13px' }}
                      onClick={() => onOpenProfile(selectedNode.id)}
                    >
                      View Full Profile
                    </button>
                  </div>
                )}

                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedNode.type === 'Person' ? 'Direct Connections' : `Connected People (${nodeDetailsPeople.length})`}
                </h4>

                {nodeDetailsLoading ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px 0' }}>
                    Loading connections...
                  </div>
                ) : nodeDetailsPeople.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px 0' }}>
                    No connections found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {nodeDetailsPeople.map(p => (
                      <div 
                        key={p.id} 
                        className="list-item-row"
                        onClick={() => onOpenProfile(p.id)}
                        style={{ cursor: 'pointer', padding: '8px 10px', fontSize: '12px' }}
                      >
                        <div>
                          <strong>{p.name}</strong>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {p.role} {p.company ? `at ${p.company}` : ''}
                          </span>
                        </div>
                        {p.relationship && (
                          <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>
                            {p.relationship}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Pathfinder({
  people,
  fromPersonId, setFromPersonId,
  toPersonId, setToPersonId,
  pathResult,
  pathLoading,
  pathError,
  onFindPath,
  onOpenProfile
}) {
  return (
    <div className="pathfinder-container animate-fade-in">
      <div className="panel" style={{ marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0' }}>
          Select any two members in the social network. The graph traversal engine will trace the shortest hop chain of relationships, showing shared interests and skills along each link.
        </p>

        <form onSubmit={onFindPath}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label>From</label>
              <select 
                value={fromPersonId} 
                onChange={e => setFromPersonId(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option value="">Choose origin...</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>To</label>
              <select 
                value={toPersonId} 
                onChange={e => setToPersonId(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              >
                <option value="">Choose target...</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%' }} 
            disabled={pathLoading || !fromPersonId || !toPersonId || fromPersonId === toPersonId}
          >
            {pathLoading ? 'Traversing graph...' : 'Find Introduction'}
          </button>
        </form>

        {pathError && <div className="error-block" style={{ marginTop: '16px' }}>{pathError}</div>}
      </div>

      {pathLoading && (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <span style={{ display: 'block', fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>🧭</span>
          Querying paths...
        </div>
      )}

      {/* Path result card views - Mockup 5 */}
      {!pathLoading && pathResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel animate-fade-in" style={{ background: 'var(--bg-card)' }}>
            {pathResult.pathFound ? (
              <div>
                <div className="success-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  ✔ <strong>Introduction found!</strong> {pathResult.edges.length}-hop connection
                </div>

                {/* Horizontal Path Graph representation - Mockup 5 */}
                <div className="pathfinder-preview-chain" style={{ marginBottom: '24px' }}>
                  {pathResult.nodes.map((node, idx) => (
                    <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div 
                        className="pathfinder-node-circle" 
                        onClick={() => onOpenProfile(node.id)}
                        style={{ cursor: 'pointer' }}
                        title={`${node.name} (${node.role})`}
                      >
                        {node.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      
                      {idx < pathResult.edges.length && (
                        <div className="pathfinder-edge-line">
                          <span className="pathfinder-edge-label">
                            {pathResult.edges[idx].relationshipType}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Path Details and lists */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>Path Details</h4>
                    <div className="path-chain">
                      {pathResult.edges.map((edge, idx) => {
                        const sNode = pathResult.nodes[idx];
                        const tNode = pathResult.nodes[idx + 1];
                        return (
                          <div key={idx} className="list-item-row" style={{ padding: '12px 16px', fontSize: '13px' }}>
                            <div>
                              <strong>{idx + 1}. {sNode?.name}</strong> knows <strong>{tNode?.name}</strong> 
                              <span style={{ marginLeft: '6px', color: 'var(--accent-cyan)' }}>
                                ({edge.relationshipType})
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              strength: {edge.strength}/10
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>Path Metadata</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <div>🔹 Total Hops: <strong>{pathResult.edges.length}</strong></div>
                      <div>🔹 Intermediate Contacts: <strong>{pathResult.nodes.length - 2}</strong></div>
                      <div>🔹 Pathway: {pathResult.nodes.map((n) => n.name).join(' ➔ ')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🚧</span>
                <h3>No introduction path found</h3>
                <p>There is a structural separation. We couldn't find a path of direct relationships connecting these members within 4 hops.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

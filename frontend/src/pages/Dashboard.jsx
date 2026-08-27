import { FaUsers, FaLink, FaBullseye, FaCode, FaBuilding, FaHeart } from 'react-icons/fa';
import GraphCanvas from '../components/GraphCanvas';

export default function Dashboard({ stats, graphData, onOpenProfile, onExploreNetwork, onFindIntroduction }) {
  if (!stats) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0' }}>
        {[1, 2, 3, 4, 5, 6].map(idx => (
          <div key={idx} className="skeleton-card" style={{ height: '110px' }} />
        ))}
      </div>
    );
  }

  // Slice graphData to show a smaller preview on the dashboard
  const getSnapshotData = () => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    // Limit to 12 nodes for a clean snapshot graph preview
    const nodes = graphData.nodes.slice(0, 12);
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = (graphData.edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    return { nodes, edges };
  };

  const snapshotData = getSnapshotData();

  return (
    <div className="animate-fade-in">
      {/* Hero Intro banner */}
      <div className="dashboard-hero-panel">
        <h2>Welcome back, Alex! 👋</h2>
        <h2>Explore your network</h2>
        <p>Discover meaningful connections through people, interests, skills and communities in your graph database.</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={onExploreNetwork}>
            Explore Network
          </button>
          <button className="btn-secondary" style={{ background: 'transparent', color: '#ffffff', borderColor: '#ffffff' }} onClick={onFindIntroduction}>
            Find an Introduction
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h3>People</h3>
            <p className="stat-value">{stats.people}</p>
            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
              +{Math.floor(stats.people * 0.1)} this week
            </span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--accent-cyan)' }}><FaUsers /></span>
        </div>
        
        <div className="stat-card">
          <div className="stat-info">
            <h3>Connections</h3>
            <p className="stat-value">{stats.connections}+</p>
            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
              +{Math.floor(stats.connections * 0.05)} this week
            </span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--accent-cyan)' }}><FaLink /></span>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Interests</h3>
            <p className="stat-value">{stats.interests}</p>
            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
              +{Math.floor(stats.interests * 0.15)} this week
            </span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--accent-green)' }}><FaBullseye /></span>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Skills</h3>
            <p className="stat-value">{stats.skills}</p>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Active</span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--accent-cyan)' }}><FaCode /></span>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Companies</h3>
            <p className="stat-value">{stats.companies}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Affiliated</span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--text-secondary)' }}><FaBuilding /></span>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Communities</h3>
            <p className="stat-value">{stats.communities}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Groups</span>
          </div>
          <span className="stat-icon" style={{ color: 'var(--accent-red)' }}><FaHeart /></span>
        </div>
      </div>

      {/* Snapshot and trending elements */}
      <div className="dashboard-sections-grid">
        {/* Your Network Snapshot (Dynamic Graph Canvas Preview!) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="panel-title">Your Network Snapshot</h2>
          <div style={{ flexGrow: 1, height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
            {snapshotData.nodes.length === 0 ? (
              <div className="graph-overlay-status">
                Loading network snapshot...
              </div>
            ) : (
              <GraphCanvas 
                data={snapshotData} 
                onNodeClick={(node) => {
                  if (node.type === 'Person') {
                    onOpenProfile(node.id);
                  }
                }} 
              />
            )}
          </div>
        </div>

        {/* Right side: top hubs and hot interests */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600' }}>
              ⚡ Trending Interests
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.topInterests?.slice(0, 4).map((interest) => (
                <div key={interest.id} className="list-item-row" style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{interest.name}</div>
                  <div style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold' }}>
                    {interest.count} members
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

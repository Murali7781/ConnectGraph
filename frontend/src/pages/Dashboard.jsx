import { FaUsers, FaLink, FaBullseye, FaCode, FaBuilding, FaHeart } from 'react-icons/fa';
import GraphCanvas from '../components/GraphCanvas';
import './Dashboard.css';


export default function Dashboard({ stats, graphData, onOpenProfile, onExploreNetwork, onFindIntroduction, greeting }) {
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
    <div className="dashboard-grid animate-fade-in">
      {/* COLUMN 1: Profile Summary Card */}
      <div className="dashboard-profile-card">
        <div className="profile-card-banner"></div>
        <div className="profile-card-avatar-container">
          <div className="profile-card-avatar" onClick={() => onOpenProfile('person_1')}>
            MM
          </div>
        </div>
        <div className="profile-card-info">
          <h2 onClick={() => onOpenProfile('person_1')}>Murali Mahi</h2>
          <p className="profile-card-headline">Machine Learning Engineer</p>
        </div>
        <div className="profile-card-stats">
          <div className="profile-stat-row">
            <span className="stat-label">Connections</span>
            <span className="stat-num">{stats.connections}</span>
          </div>
          <div className="profile-stat-row">
            <span className="stat-label">Profile views</span>
            <span className="stat-num">47</span>
          </div>
        </div>
        <div className="profile-card-skills-preview">
          <h4>Key Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            <span className="mini-tag">Neo4j</span>
            <span className="mini-tag">Python</span>
            <span className="mini-tag">PyTorch</span>
          </div>
        </div>
      </div>

      {/* COLUMN 2: Main Feed Column */}
      <div className="dashboard-feed-column">
        {/* Hero Intro banner */}
        <div className="dashboard-hero-panel">
          <h2>{greeting || 'Welcome back, Murali'}! 👋</h2>
          <h2>Explore your network</h2>
          <p>Discover meaningful connections through people, interests, skills and communities in your professional graph database.</p>
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
        <div className="stats-grid">
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
        </div>

        {/* Your Network Snapshot */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
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
      </div>

      {/* COLUMN 3: Right Panel */}
      <div className="dashboard-trends-column">
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
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

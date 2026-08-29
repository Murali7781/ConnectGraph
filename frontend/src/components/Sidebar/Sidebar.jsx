import { NavLink } from 'react-router-dom';
import { FaChartBar, FaUsers, FaNetworkWired, FaRoute, FaLightbulb, FaCog } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({
  isSidebarCollapsed,
  handleNavClick,
  handleSeed,
  seeding,
  health,
  handleOpenProfile
}) {
  return (
    <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <nav className="nav-links-list">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-tab-btn ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FaChartBar /> <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/people"
          className={({ isActive }) => `sidebar-tab-btn ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FaUsers /> <span>People</span>
        </NavLink>
        <NavLink
          to="/graph"
          className={({ isActive }) => `sidebar-tab-btn ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FaNetworkWired /> <span>Network Explorer</span>
        </NavLink>
        <NavLink
          to="/pathfinder"
          className={({ isActive }) => `sidebar-tab-btn ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FaRoute /> <span>Introduction Paths</span>
        </NavLink>
        <NavLink
          to="/recommendations"
          className={({ isActive }) => `sidebar-tab-btn ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FaLightbulb /> <span>Recommendations</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {/* Bottom Actions */}
        <button
          className="sidebar-tab-btn"
          style={{ padding: '8px 14px', marginBottom: '8px' }}
          onClick={handleSeed}
          disabled={seeding}
        >
          <FaCog /> <span className="sidebar-footer-text">{seeding ? 'Seeding...' : 'Reset & Seed'}</span>
        </button>
        {/* Profile footer avatar with dynamic health indicator dot */}
        <div
          onClick={() => handleOpenProfile('person_1')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}
        >
          <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '11px'
              }}
            >
              MM
            </div>
            <span
              className={`status-indicator ${health?.connected ? 'status-connected' : 'status-disconnected'}`}
              style={{ position: 'absolute', bottom: '-1px', right: '-1px', border: '1.5px solid #ffffff' }}
            />
          </div>
          <div style={{ textAlign: 'left' }} className="sidebar-footer-text">
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>Murali Mahi</div>
            <div style={{ fontSize: '10px', color: '#cbd5e1' }}>ML Engineer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

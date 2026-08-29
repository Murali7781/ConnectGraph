import { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { FaChartBar, FaUsers, FaNetworkWired, FaRoute, FaLightbulb, FaBell, FaCog, FaBars } from 'react-icons/fa';

// Modular Pages
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Pathfinder from './pages/Pathfinder';
import NetworkExplorer from './pages/NetworkExplorer';
import Recommendations from './pages/Recommendations';

// Modular Components
import ProfileModal from './components/ProfileModal';
import Sidebar from './components/Sidebar/Sidebar';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Health and general statistics
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);

  // Lists of data
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [interests, setInterests] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personDetail, setPersonDetail] = useState(null);

  // Modal toggle
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter & Search states for People tab
  const [searchName, setSearchName] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  const [searchInterest, setSearchInterest] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCommunity, setSearchCommunity] = useState('');

  // Pathfinder States
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [pathResult, setPathResult] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathError, setPathError] = useState('');

  // Interest Explorer States
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [interestPeople, setInterestPeople] = useState([]);
  const [interestLoading, setInterestLoading] = useState(false);

  // Network Explorer (Graph) States
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [graphFilterType, setGraphFilterType] = useState('all'); // 'all', 'person', 'interest'
  const [graphFilterId, setGraphFilterId] = useState('');
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');

  // Seeding states
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');
  const [seedError, setSeedError] = useState('');

  // Fetch Stats & Health
  const fetchStatsAndHealth = async () => {
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      const healthData = await healthRes.json();
      setHealth(healthData);

      if (healthData.connected) {
        const statsRes = await fetch(`${API_BASE}/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching stats/health:", err);
      setHealth({ connected: false, error: "Backend server is offline or unreachable." });
    }
  };

  // Fetch People Directory
  const fetchPeople = async () => {
    setPeopleLoading(true);
    try {
      const query = new URLSearchParams({
        name: searchName,
        skill: searchSkill,
        interest: searchInterest,
        company: searchCompany,
        city: searchCity,
        community: searchCommunity
      }).toString();

      const res = await fetch(`${API_BASE}/people?${query}`);
      const data = await res.json();
      if (res.ok) {
        setPeople(data);
      }
    } catch (err) {
      console.error("Error fetching people directory:", err);
    } finally {
      setPeopleLoading(false);
    }
  };

  // Fetch Interests Directory
  const fetchInterests = async () => {
    try {
      const res = await fetch(`${API_BASE}/interests`);
      const data = await res.json();
      if (res.ok) {
        setInterests(data);
      }
    } catch (err) {
      console.error("Error fetching interests:", err);
    }
  };

  // Initialize
  useEffect(() => {
    fetchStatsAndHealth();
    fetchPeople();
    fetchInterests();
    fetchGraphData();
  }, []);

  // Sync people directory whenever filters change (with debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPeople();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchName, searchSkill, searchInterest, searchCompany, searchCity, searchCommunity]);

  // Open profile modal & load full metadata + recommendations
  const handleOpenProfile = async (personId) => {
    setSelectedPerson(personId);
    setIsModalOpen(true);
    setPersonDetail(null);
    try {
      // 1. Fetch details and direct connections
      const detailRes = await fetch(`${API_BASE}/people/${personId}`);
      if (!detailRes.ok) throw new Error("Profile details not found");
      const detailData = await detailRes.json();

      // 2. Fetch recommendations
      const recsRes = await fetch(`${API_BASE}/people/${personId}/recommendations`);
      const recsData = recsRes.ok ? await recsRes.json() : [];

      setPersonDetail({
        ...detailData,
        recommendations: recsData || []
      });
    } catch (err) {
      console.error("Error fetching person details:", err);
      setPersonDetail({
        error: true,
        message: "Failed to retrieve connection profile. The database might be initializing or unreachable."
      });
    }
  };

  // Seeding trigger
  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess('');
    setSeedError('');
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedSuccess("Graph database successfully reset and seeded!");
        await fetchStatsAndHealth();
        await fetchPeople();
        await fetchInterests();
        fetchGraphData();
      } else {
        setSeedError(data.error || "Failed to seed database.");
      }
    } catch (err) {
      setSeedError("Could not connect to backend server.");
    } finally {
      setSeeding(false);
    }
  };

  // Pathfinder trigger
  const handleFindPath = async (e) => {
    e.preventDefault();
    if (!fromPersonId || !toPersonId) {
      setPathError("Please select both Origin and Target members.");
      return;
    }
    if (fromPersonId === toPersonId) {
      setPathError("Please select different individuals.");
      return;
    }
    setPathLoading(true);
    setPathError('');
    setPathResult(null);
    try {
      const res = await fetch(`${API_BASE}/path?from=${fromPersonId}&to=${toPersonId}`);
      const data = await res.json();
      if (res.ok) {
        setPathResult(data);
      } else {
        setPathError(data.error || "Failed to trace path.");
      }
    } catch (err) {
      setPathError("Failed to communicate with API server.");
    } finally {
      setPathLoading(false);
    }
  };

  // Interest Detail exploration trigger
  const handleExploreInterest = async (interest) => {
    setSelectedInterest(interest);
    setInterestPeople([]);
    setInterestLoading(true);
    try {
      const res = await fetch(`${API_BASE}/interests/${interest.id}/people`);
      const data = await res.json();
      if (res.ok) {
        setInterestPeople(data);
      }
    } catch (err) {
      console.error("Error fetching interest details:", err);
    } finally {
      setInterestLoading(false);
    }
  };

  // Graph Data fetcher for explorer tab
  const fetchGraphData = async () => {
    setGraphLoading(true);
    setGraphError('');
    try {
      let url = `${API_BASE}/graph`;
      if (graphFilterType === 'person' && graphFilterId) {
        url += `?personId=${graphFilterId}`;
      } else if (graphFilterType === 'interest' && graphFilterId) {
        url += `?interestId=${graphFilterId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setGraphData(data);
      } else {
        setGraphError("Failed to retrieve graph model schema.");
      }
    } catch (err) {
      setGraphError("Unable to communicate with the database graph service.");
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [graphFilterType, graphFilterId]);

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  // Page Header contexts
  const getHeaderContext = () => {
    switch (location.pathname) {
      case '/':
        return { title: `${getDynamicGreeting()}, Murali`, desc: 'Explore your network and discover meaningful connections.' };
      case '/people':
        return { title: 'People Discovery', desc: 'Find people through shared interests, skills and connections.' };
      case '/graph':
        return { title: 'Network Explorer', desc: 'Explore how people, interests and organizations connect.' };
      case '/pathfinder':
        return { title: 'Find an Introduction', desc: 'See how you\'re connected to someone through your network.' };
      case '/recommendations':
        return { title: 'Recommended Connections', desc: 'People you may want to connect with based on your network.' };
      default:
        return { title: 'Wexa AI Connect', desc: 'Graph Database Explorer' };
    }
  };

  const headerContext = getHeaderContext();

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="app-shell">
      {/* 1. TOPBAR HEADER */}
      <header className="app-topbar">
        <div className="topbar-left">
          <button className="sidebar-toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <FaBars />
          </button>
          <div className="topbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <FaNetworkWired style={{ color: 'var(--accent-cyan)' }} />
            <span>ConnectGraph</span>
          </div>
          <div className="topbar-search">
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search network..."
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                if (location.pathname !== '/people') navigate('/people');
              }}
            />
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn-seed-top"
            onClick={handleSeed}
            disabled={seeding}
            title="Reset and seed graph database with fresh mock profiles"
          >
            <FaCog style={{ marginRight: '6px' }} />
            <span>{seeding ? 'Seeding...' : 'Reset DB'}</span>
          </button>
          
          <div className="notification-bell">
            <FaBell />
            <span className="notification-badge" />
          </div>

          <div className="topbar-profile" onClick={() => handleOpenProfile('person_1')}>
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
                fontSize: '11px',
                position: 'relative'
              }}
            >
              MM
              <span
                className={`status-indicator ${health?.connected ? 'status-connected' : 'status-disconnected'}`}
                style={{ position: 'absolute', bottom: '-1px', right: '-1px', border: '1.5px solid #ffffff' }}
              />
            </div>
            <span className="profile-name-text">Me ▾</span>
          </div>
        </div>
      </header>


      {/* 2. BODY GRID */}

      <div className="app-body">
        {/* Mobile Sidebar Overlay Backdrop */}
        <div
          className={`sidebar-overlay ${!isSidebarCollapsed ? 'active' : ''}`}
          onClick={() => setIsSidebarCollapsed(true)}
        />


        {/* Left Navigation Sidebar */}
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          handleNavClick={handleNavClick}
          handleSeed={handleSeed}
          seeding={seeding}
          health={health}
          handleOpenProfile={handleOpenProfile}
        />

        {/* Right Main Page Panel */}
        <main className="app-main">
          <header className="page-header">
            <div>
              <h2>{headerContext.title}</h2>
              <p>{headerContext.desc}</p>
            </div>
          </header>

          <div className="page-content">
            {/* Database Connection Alert */}
            {!health?.connected && (
              <div className="error-block animate-fade-in">
                <strong>Database Connection Offline</strong>
                <p style={{ marginTop: '6px', fontSize: '13px' }}>
                  {health?.error || "The application is unable to reach the CognoDB instance. Please rename backend/.env.example to backend/.env and populate it with your CognoDB Cloud Bolt URI and password."}
                </p>
                <button className="btn-primary" style={{ marginTop: '10px' }} onClick={fetchStatsAndHealth}>
                  Retry Connection
                </button>
              </div>
            )}

            {seedSuccess && <div className="success-banner">{seedSuccess}</div>}
            {seedError && <div className="error-banner">{seedError}</div>}

            {/* Switch routes */}
            {health?.connected && (
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      stats={stats}
                      graphData={graphData}
                      onOpenProfile={handleOpenProfile}
                      onExploreNetwork={() => navigate('/graph')}
                      onFindIntroduction={() => navigate('/pathfinder')}
                      greeting={`${getDynamicGreeting()}, Murali`}
                    />
                  }
                />
                <Route
                  path="/people"
                  element={
                    <People
                      people={people}
                      loading={peopleLoading}
                      onOpenProfile={handleOpenProfile}
                      searchName={searchName} setSearchName={setSearchName}
                      searchSkill={searchSkill} setSearchSkill={setSearchSkill}
                      searchInterest={searchInterest} setSearchInterest={setSearchInterest}
                      searchCompany={searchCompany} setSearchCompany={setSearchCompany}
                      searchCity={searchCity} setSearchCity={setSearchCity}
                      searchCommunity={searchCommunity} setSearchCommunity={setSearchCommunity}
                    />
                  }
                />
                <Route
                  path="/graph"
                  element={
                    <NetworkExplorer
                      graphData={graphData}
                      graphLoading={graphLoading}
                      graphError={graphError}
                      graphFilterType={graphFilterType} setGraphFilterType={setGraphFilterType}
                      graphFilterId={graphFilterId} setGraphFilterId={setGraphFilterId}
                      people={people}
                      interests={interests}
                      onOpenProfile={handleOpenProfile}
                      API_BASE={API_BASE}
                    />
                  }
                />
                <Route
                  path="/pathfinder"
                  element={
                    <Pathfinder
                      people={people}
                      fromPersonId={fromPersonId} setFromPersonId={setFromPersonId}
                      toPersonId={toPersonId} setToPersonId={setToPersonId}
                      pathResult={pathResult}
                      pathLoading={pathLoading}
                      pathError={pathError}
                      onFindPath={handleFindPath}
                      onOpenProfile={handleOpenProfile}
                    />
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <Recommendations
                      people={people}
                      onOpenProfile={handleOpenProfile}
                      onFindIntroduction={() => navigate('/pathfinder')}
                      API_BASE={API_BASE}
                    />
                  }
                />
              </Routes>
            )}
          </div>
        </main>
      </div>

      {/* DETAILED PROFILE MODAL */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        personId={selectedPerson}
        personDetail={personDetail}
        onOpenProfile={handleOpenProfile}
      />
    </div>
  );
}

export default App;

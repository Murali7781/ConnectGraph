import { useState } from 'react';
import { FaSearch, FaUsers, FaUserCircle } from 'react-icons/fa';

// Helper component for Person cards to handle offline image fallbacks using react-icons
function PersonCard({ person, onOpenProfile }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="person-card"
      onClick={() => onOpenProfile(person.id)}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div>
        <div className="card-header-row">
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '700', 
              fontSize: '15px',
              flexShrink: 0
            }}
          >
            {person.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '600' }}>{person.name}</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {person.role}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
              {person.company} • {person.city}
            </span>
          </div>
        </div>

        <div className="tags-row" style={{ marginTop: '16px' }}>
          {person.skills?.slice(0, 3).map(s => (
            <span key={s} className="tag tag-skill">{s}</span>
          ))}
          {person.interests?.slice(0, 3).map(i => (
            <span key={i} className="tag tag-interest">{i}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {person.experience_years + 3} connections
        </span>
        <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
          View Profile →
        </span>
      </div>
    </div>
  );
}

export default function People({ 
  people, 
  loading, 
  onOpenProfile,
  searchName, setSearchName,
  searchSkill, setSearchSkill,
  searchInterest, setSearchInterest,
  searchCompany, setSearchCompany,
  searchCity, setSearchCity,
  searchCommunity, setSearchCommunity
}) {
  const handleClearFilters = () => {
    setSearchName('');
    setSearchSkill('');
    setSearchInterest('');
    setSearchCompany('');
    setSearchCity('');
    setSearchCommunity('');
  };

  return (
    <div className="animate-fade-in">
      {/* Directory Filter Panel */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main search input bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FaSearch style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchName} 
              onChange={e => setSearchName(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px 12px 42px', fontSize: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-deep)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          {/* Row of dropdown selectors + clear filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ minWidth: '130px' }}>
              <select value={searchInterest} onChange={e => setSearchInterest(e.target.value)} style={{ padding: '8px', fontSize: '12px' }}>
                <option value="">Interest</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
                <option value="Game Development">Game Development</option>
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '130px' }}>
              <select value={searchSkill} onChange={e => setSearchSkill(e.target.value)} style={{ padding: '8px', fontSize: '12px' }}>
                <option value="">Skill</option>
                <option value="Python">Python</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Go">Go</option>
                <option value="Figma">Figma</option>
                <option value="Docker">Docker</option>
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '130px' }}>
              <select value={searchCompany} onChange={e => setSearchCompany(e.target.value)} style={{ padding: '8px', fontSize: '12px' }}>
                <option value="">Company</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Wexa AI">Wexa AI</option>
                <option value="Stripe">Stripe</option>
                <option value="OpenAI">OpenAI</option>
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '130px' }}>
              <select value={searchCommunity} onChange={e => setSearchCommunity(e.target.value)} style={{ padding: '8px', fontSize: '12px' }}>
                <option value="">Community</option>
                <option value="Technology & Engineering">Technology & Engineering</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                <option value="Startups & Entrepreneurship">Startups & Entrepreneurship</option>
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '130px' }}>
              <select value={searchCity} onChange={e => setSearchCity(e.target.value)} style={{ padding: '8px', fontSize: '12px' }}>
                <option value="">City</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Tokyo">Tokyo</option>
                <option value="Berlin">Berlin</option>
              </select>
            </div>

            <button 
              className="btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '12px', marginLeft: 'auto' }} 
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid mapping cards */}
      {loading ? (
        <div className="people-grid">
          {[1, 2, 3, 4, 5, 6].map(idx => (
            <div key={idx} className="skeleton-card" style={{ height: '220px' }} />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="empty-state">
          <FaUsers style={{ fontSize: '36px', color: 'var(--text-secondary)' }} />
          <h3>No people match your filters</h3>
          <p>Remove search fields to widen connection queries.</p>
        </div>
      ) : (
        <div className="people-grid">
          {people.map(person => (
            <PersonCard 
              key={person.id} 
              person={person} 
              onOpenProfile={onOpenProfile} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';

// Helper component for Recommendation card to handle offline image fallbacks using react-icons
function RecommendationCard({ rec, onOpenProfile, getStrokeOffset, onFindIntroduction }) {
  return (
    <div 
      className="person-card"
      onClick={() => onOpenProfile(rec.person.id)}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '700', 
                fontSize: '15px',
                flexShrink: 0
              }}
            >
              {rec.person.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '600' }}>{rec.person.name}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {rec.person.role}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {rec.person.company}
              </span>
            </div>
          </div>

          {/* Circular Matching Ring Display - Mockup 6 */}
          <div style={{ position: 'relative', width: '54px', height: '54px' }}>
            <svg className="circular-progress-svg">
              <circle className="circular-progress-bg" cx="27" cy="27" r="24" />
              <circle 
                className="circular-progress-fill" 
                cx="27" 
                cy="27" 
                r="24" 
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={getStrokeOffset(rec.score)}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--accent-green)' }}>
              {rec.score}%
            </div>
          </div>
        </div>

        <div className="card-body" style={{ marginTop: '14px' }}>
          {/* Matching reasons metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
            {rec.sharedInterests.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shared Interests</span>
                <strong style={{ color: 'var(--text-primary)' }}>{rec.sharedInterests.length}</strong>
              </div>
            )}
            {rec.sharedSkills.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shared Skills</span>
                <strong style={{ color: 'var(--text-primary)' }}>{rec.sharedSkills.length}</strong>
              </div>
            )}
            {rec.mutualConnections.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Mutual Connections</span>
                <strong style={{ color: 'var(--text-primary)' }}>{rec.mutualConnections.length}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
        <button 
          className="btn-secondary" 
          style={{ padding: '8px', fontSize: '12px' }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(rec.person.id);
          }}
        >
          View Profile
        </button>
        <button 
          className="btn-primary" 
          style={{ padding: '8px', fontSize: '12px' }}
          onClick={(e) => {
            e.stopPropagation();
            onFindIntroduction();
          }}
        >
          Find Introduction
        </button>
      </div>
    </div>
  );
}

export default function Recommendations({ people, onOpenProfile, onFindIntroduction, API_BASE }) {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default to selecting the current login user (Alex Smith / person_1) automatically to simulate mockup
  useEffect(() => {
    if (people.length > 0) {
      setSelectedPersonId('person_1');
    }
  }, [people]);

  useEffect(() => {
    if (!selectedPersonId) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE}/people/${selectedPersonId}/recommendations`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecommendations(data);
        } else {
          setRecommendations([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed fetching recommendations:", err);
        setError("Unable to retrieve recommendations from the database.");
        setLoading(false);
      });
  }, [selectedPersonId, API_BASE]);

  // Compute circular ring offset (radius=24, perimeter=2*pi*24 = 150.79)
  const getStrokeOffset = (score) => {
    const perimeter = 2 * Math.PI * 24;
    return perimeter - (score / 100) * perimeter;
  };

  return (
    <div className="animate-fade-in">
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label>Get Recommendations For</label>
          <select 
            value={selectedPersonId} 
            onChange={e => setSelectedPersonId(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          >
            <option value="">-- Choose Member --</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="people-grid">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="skeleton-card" style={{ height: '220px' }} />
          ))}
        </div>
      ) : error ? (
        <div className="error-block">{error}</div>
      ) : !selectedPersonId ? (
        <div className="empty-state">
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💡</span>
          <h3>Select a member to begin</h3>
          <p>Choose an individual from the dropdown above to calculate connection recommendations.</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💡</span>
          <h3>No recommended connections found</h3>
          <p>This member already knows everyone in their community, or there are no overlapping matches.</p>
        </div>
      ) : (
        <div className="people-grid">
          {recommendations.map(rec => (
            <RecommendationCard 
              key={rec.person.id} 
              rec={rec} 
              onOpenProfile={onOpenProfile} 
              getStrokeOffset={getStrokeOffset}
              onFindIntroduction={onFindIntroduction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

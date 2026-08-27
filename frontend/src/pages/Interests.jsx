export default function Interests({
  interests,
  selectedInterest,
  interestPeople,
  interestLoading,
  onExploreInterest,
  onOpenProfile
}) {
  return (
    <div className="interests-grid-layout animate-fade-in">
      {/* Left Column: Interest directory */}
      <div className="panel">
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>🎯 Interests Directory</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {interests.map(interest => (
            <div 
              key={interest.id} 
              className={`interest-list-item ${selectedInterest?.id === interest.id ? 'active' : ''}`}
              onClick={() => onExploreInterest(interest)}
            >
              <span>{interest.name}</span>
              <span className="badge">{interest.count} people</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Interest details explorer */}
      <div className="panel">
        {selectedInterest ? (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
              Exploring Interest: {selectedInterest.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Showing members in the professional network who share the <strong>{selectedInterest.name}</strong> interest relationship node.
            </p>

            {interestLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Querying CognoDB Graph...
              </div>
            ) : interestPeople.length === 0 ? (
              <div className="empty-state">No members matched this interest label.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {interestPeople.map(p => (
                  <div 
                    key={p.id} 
                    className="list-item-row"
                    onClick={() => onOpenProfile(p.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                          color: '#ffffff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '700', 
                          fontSize: '12px',
                          flexShrink: 0
                        }}
                      >
                        {p.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>{p.name}</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {p.role} at {p.company || 'Freelance'}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      📍 {p.city}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🎯</span>
            <h3>No interest selected</h3>
            <p>Select an interest topic from the left directory column to inspect connected network members.</p>
          </div>
        )}
      </div>
    </div>
  );
}

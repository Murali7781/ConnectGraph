import './ProfileModal.css';

// Reusable Modal Component to show full Profile details & Matching Recommendations
export default function ProfileModal({ isOpen, onClose, personId, personDetail, onOpenProfile }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {!personDetail ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'block', fontSize: '24px', marginBottom: '12px' }}>🔄</span>
            Querying network databases...
          </div>
        ) : personDetail.error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-red)' }}>
            <span style={{ display: 'block', fontSize: '24px', marginBottom: '12px' }}>⚠️</span>
            <h3>Profile Unreachable</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>{personDetail.message}</p>
          </div>
        ) : (
          <div>
            {/* Profile Header section */}
            <div className="modal-profile-header">
              {/* Professional initials avatar circle - replaces cartoon image */}
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '700', 
                  fontSize: '24px',
                  boxShadow: '0 4px 6px rgba(59, 130, 246, 0.15)',
                  flexShrink: 0
                }}
              >
                {personDetail.person.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>

              <div>
                <h2 style={{ margin: '0', fontSize: '24px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  {personDetail.person.name}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--accent-cyan)', fontWeight: '500', fontSize: '15px' }}>
                  {personDetail.person.role} at {personDetail.person.company || 'Freelance'}
                </p>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                  📍 Lives in {personDetail.person.city} • 💼 Member of {personDetail.person.community}
                </span>
              </div>
            </div>

            {/* Profile detail grid layout */}
            <div className="modal-details-grid">
              <div className="profile-about-column">
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>About</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', background: 'var(--bg-deep)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {personDetail.person.bio}
                </p>

                <h3 style={{ margin: '20px 0 8px', fontSize: '16px', fontWeight: '600' }}>Skills & Interests</h3>
                <div className="tags-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  {personDetail.person.skills?.map(s => (
                    <span key={s} className="tag tag-skill">{s}</span>
                  ))}
                  {personDetail.person.interests?.map(i => (
                    <span key={i} className="tag tag-interest">{i}</span>
                  ))}
                </div>

                <h3 style={{ margin: '20px 0 8px', fontSize: '16px', fontWeight: '600' }}>
                  Direct Connections ({personDetail.connections.length})
                </h3>
                <div className="modal-connections-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {personDetail.connections.length === 0 ? (
                    <div className="empty-state-small">No direct connections established in graph.</div>
                  ) : (
                    personDetail.connections.map(c => (
                      <div 
                        key={c.id} 
                        className="list-item-row"
                        onClick={() => onOpenProfile(c.id)}
                        style={{ cursor: 'pointer', padding: '10px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}
                      >
                        <div 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: '#e2e8f0', 
                            color: '#475569', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: '700', 
                            fontSize: '11px',
                            flexShrink: 0
                          }}
                        >
                          {c.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <strong>{c.name}</strong> 
                          <span style={{ marginLeft: '6px', fontSize: '11px', padding: '2px 6px', background: 'var(--bg-deep)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                            {c.relType}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>since {c.relSince}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recommendations Column */}
              <div className="profile-recommendations-column">
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--accent-green)', fontWeight: '600' }}>
                  💡 Smart Recommendations (Network Match)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 16px' }}>
                  Graph affinity suggestions based on matching interests, mutual connection path, and skills.
                </p>

                <div className="recs-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {personDetail.recommendations?.length === 0 ? (
                    <div className="empty-state-small">No recommended matches. Seeding more data is recommended.</div>
                  ) : (
                    personDetail.recommendations.map(rec => (
                      <div 
                        key={rec.person.id} 
                        className="rec-row-item"
                        onClick={() => onOpenProfile(rec.person.id)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rec.person.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                            {rec.score}% Match
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', margin: '2px 0' }}>
                          {rec.person.role} at {rec.person.company || 'Freelance'}
                        </span>
                        
                        <div className="rec-match-reasons">
                          {rec.sharedInterests.length > 0 && (
                            <div className="reason-bullet text-green">
                              • Shared Interests: {rec.sharedInterests.slice(0,2).join(', ')}
                            </div>
                          )}
                          {rec.sharedSkills.length > 0 && (
                            <div className="reason-bullet text-cyan">
                              • Shared Skills: {rec.sharedSkills.slice(0,2).join(', ')}
                            </div>
                          )}
                          {rec.mutualConnections.length > 0 && (
                            <div className="reason-bullet text-yellow">
                              • Mutuals: {rec.mutualConnections.slice(0,2).join(', ')} ({rec.mutualConnections.length})
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

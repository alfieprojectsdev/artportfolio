import { useState, useEffect } from 'react';
import CloudinaryUploadWidget, { type CloudinaryUploadResult } from './CloudinaryUploadWidget';
import type { PortfolioItem, CommissionRequest, SiteSettings } from '../../db/schema';

interface AdminDashboardProps {
  cloudName: string;
  uploadPreset: string;
}

type Tab = 'gallery' | 'commissions' | 'settings';
type CommissionStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined';
type SortField = 'createdAt' | 'clientName' | 'status';
type SortOrder = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#10b981',
  in_progress: '#3b82f6',
  completed: '#6366f1',
  declined: '#ef4444',
};

export default function AdminDashboard({ cloudName, uploadPreset }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [galleryItems, setGalleryItems] = useState<PortfolioItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionRequest[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Commission management state
  const [statusFilter, setStatusFilter] = useState<CommissionStatus>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCommission, setSelectedCommission] = useState<CommissionRequest | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingQuotedPrice, setEditingQuotedPrice] = useState<number | ''>('');

  // Form state for new gallery item
  const [newItem, setNewItem] = useState({
    title: '',
    imageUrl: '',      // Rendered/final version (required)
    flatUrl: '',       // Flat/sketch version for comparison slider (optional)
    category: 'commission',
    altText: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [galleryRes, commissionsRes, settingsRes] = await Promise.all([
        fetch('/api/gallery'),
        fetch('/api/commissions'),
        fetch('/api/settings'),
      ]);

      if (galleryRes.ok) setGalleryItems(await galleryRes.json());
      if (commissionsRes.ok) setCommissions(await commissionsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (result: CloudinaryUploadResult, type: 'rendered' | 'flat') => {
    setNewItem(prev => ({
      ...prev,
      [type === 'rendered' ? 'imageUrl' : 'flatUrl']: result.secure_url,
    }));
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const item = await res.json();
        setGalleryItems(prev => [item, ...prev]);
        setNewItem({ title: '', imageUrl: '', flatUrl: '', category: 'commission', altText: '' });
      }
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleryItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleUpdateCommissionStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/commissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCommissions(prev =>
          prev.map(c => (c.id === id ? { ...c, status } : c))
        );
        if (selectedCommission?.id === id) {
          setSelectedCommission(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleUpdateCommission = async (id: number, updates: Partial<CommissionRequest>) => {
    try {
      const res = await fetch(`/api/commissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setCommissions(prev =>
          prev.map(c => (c.id === id ? { ...c, ...updates } : c))
        );
        if (selectedCommission?.id === id) {
          setSelectedCommission(prev => prev ? { ...prev, ...updates } : null);
        }
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to update commission');
      return false;
    }
  };

  const openCommissionDetail = (commission: CommissionRequest) => {
    setSelectedCommission(commission);
    setEditingNotes(commission.notes || '');
    setEditingQuotedPrice(commission.quotedPrice || '');
  };

  const saveCommissionDetails = async () => {
    if (!selectedCommission) return;
    const success = await handleUpdateCommission(selectedCommission.id, {
      notes: editingNotes,
      quotedPrice: editingQuotedPrice === '' ? null : Number(editingQuotedPrice),
    });
    if (success) {
      alert('Commission updated!');
    }
  };

  // Filter and sort commissions
  const filteredCommissions = commissions
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      } else if (sortField === 'clientName') {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Settings saved!');
      }
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <button
          className={activeTab === 'gallery' ? 'active' : ''}
          onClick={() => setActiveTab('gallery')}
          style={activeTab === 'gallery' ? {
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.5)',
            fontWeight: 700,
            transform: 'scale(1.03)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          } : {}}
        >
          Gallery ({galleryItems.length})
        </button>
        <button
          className={activeTab === 'commissions' ? 'active' : ''}
          onClick={() => setActiveTab('commissions')}
          style={activeTab === 'commissions' ? {
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.5)',
            fontWeight: 700,
            transform: 'scale(1.03)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          } : {}}
        >
          Commissions ({commissions.filter(c => c.status === 'pending').length} pending)
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
          style={activeTab === 'settings' ? {
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.5)',
            fontWeight: 700,
            transform: 'scale(1.03)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          } : {}}
        >
          Settings
        </button>
      </nav>

      {error && <div className="admin-error">{error}</div>}

      {activeTab === 'gallery' && (
        <div className="admin-section">
          <h2>Gallery Management</h2>

          <form onSubmit={handleAddGalleryItem} className="add-item-form">
            <h3>Add New Artwork</h3>

            <fieldset className="form-fieldset">
              <legend>Images</legend>

              <div className="form-group">
                <label>Rendered Image (Required)</label>
                <p className="field-hint">The final/rendered version of the artwork</p>
                {newItem.imageUrl ? (
                  <div className="preview-image">
                    <img src={newItem.imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/')} alt="Rendered preview" />
                    <button type="button" onClick={() => setNewItem(prev => ({ ...prev, imageUrl: '' }))}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <CloudinaryUploadWidget
                    key="rendered-upload"
                    id="rendered-upload"
                    cloudName={cloudName}
                    uploadPreset={uploadPreset}
                    onUpload={(result) => handleImageUpload(result, 'rendered')}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Flat Image (Optional)</label>
                <p className="field-hint">The flat/sketch version for before/after comparison slider</p>
                {newItem.flatUrl ? (
                  <div className="preview-image">
                    <img src={newItem.flatUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/')} alt="Flat preview" />
                    <button type="button" onClick={() => setNewItem(prev => ({ ...prev, flatUrl: '' }))}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <CloudinaryUploadWidget
                    key="flat-upload"
                    id="flat-upload"
                    cloudName={cloudName}
                    uploadPreset={uploadPreset}
                    onUpload={(result) => handleImageUpload(result, 'flat')}
                  />
                )}
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend>Artwork Details</legend>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="commission">Commission</option>
                    <option value="fanart">Fanart</option>
                    <option value="original">Original</option>
                    <option value="wip">Work in Progress</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Alt Text (accessibility)</label>
                  <input
                    type="text"
                    value={newItem.altText}
                    onChange={e => setNewItem(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="Describe the image"
                  />
                </div>
              </div>
            </fieldset>

            <button type="submit" disabled={!newItem.imageUrl || !newItem.title}>
              Add to Gallery
            </button>
          </form>

          <div className="gallery-list">
            <h3>Current Gallery Items</h3>
            {galleryItems.map(item => (
              <div key={item.id} className="gallery-list-item">
                <img src={item.imageUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} alt={item.altText || item.title} />
                <div className="item-info">
                  <strong>{item.title}</strong>
                  <span className="separator" aria-hidden="true">|</span>
                  <span className="category">{item.category}</span>
                  {item.flatUrl && <span className="has-slider" title="Has before/after comparison">↔</span>}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteGalleryItem(item.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="admin-section">
          <h2>Commission Requests</h2>

          {/* Filter bar */}
          <div className="commission-filters">
            <div className="filter-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as CommissionStatus)}>
                <option value="all">All ({commissions.length})</option>
                <option value="pending">Pending ({commissions.filter(c => c.status === 'pending').length})</option>
                <option value="accepted">Accepted ({commissions.filter(c => c.status === 'accepted').length})</option>
                <option value="in_progress">In Progress ({commissions.filter(c => c.status === 'in_progress').length})</option>
                <option value="completed">Completed ({commissions.filter(c => c.status === 'completed').length})</option>
                <option value="declined">Declined ({commissions.filter(c => c.status === 'declined').length})</option>
              </select>
            </div>
          </div>

          <table className="commissions-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('clientName')} className="sortable">
                  Client {sortField === 'clientName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Type</th>
                <th>Price</th>
                <th onClick={() => toggleSort('status')} className="sortable">
                  Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => toggleSort('createdAt')} className="sortable">
                  Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">No commissions found</td>
                </tr>
              ) : (
                filteredCommissions.map(commission => (
                  <tr key={commission.id} className={`status-${commission.status}`}>
                    <td>
                      <strong>{commission.clientName}</strong>
                      <br />
                      <small>{commission.email}</small>
                      {commission.discord && <small><br />Discord: {commission.discord}</small>}
                    </td>
                    <td>
                      <span className="art-type">{commission.artType}</span>
                      {commission.style && <span className="style-badge">{commission.style}</span>}
                    </td>
                    <td>
                      {commission.quotedPrice ? (
                        <strong>₱{commission.quotedPrice}</strong>
                      ) : commission.estimatedPrice ? (
                        <span className="estimated">~₱{commission.estimatedPrice}</span>
                      ) : (
                        <span className="no-price">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: STATUS_COLORS[commission.status || 'pending'] }}
                      >
                        {commission.status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(commission.createdAt!).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn-view" onClick={() => openCommissionDetail(commission)}>
                        View
                      </button>
                      <select
                        value={commission.status || 'pending'}
                        onChange={e => handleUpdateCommissionStatus(commission.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Commission Detail Modal */}
          {selectedCommission && (
            <div className="modal-overlay" onClick={() => setSelectedCommission(null)}>
              <div className="modal-content commission-detail" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedCommission(null)}>×</button>

                <div className="modal-header">
                  <h3>Commission #{selectedCommission.id}</h3>
                  <span
                    className="status-badge large"
                    style={{ backgroundColor: STATUS_COLORS[selectedCommission.status || 'pending'] }}
                  >
                    {selectedCommission.status || 'pending'}
                  </span>
                </div>

                <div className="detail-grid">
                  <fieldset className="form-fieldset modal-fieldset">
                    <legend>Client Info</legend>
                    <p><strong>Name:</strong> {selectedCommission.clientName}</p>
                    <p><strong>Email:</strong> <a href={`mailto:${selectedCommission.email}`}>{selectedCommission.email}</a></p>
                    {selectedCommission.discord && <p><strong>Discord:</strong> {selectedCommission.discord}</p>}
                    <p><strong>Submitted:</strong> {new Date(selectedCommission.createdAt!).toLocaleString()}</p>
                  </fieldset>

                  <fieldset className="form-fieldset modal-fieldset">
                    <legend>Commission Details</legend>
                    <p><strong>Type:</strong> {selectedCommission.artType}</p>
                    <p><strong>Style:</strong> {selectedCommission.style || 'Not specified'}</p>
                    <p><strong>Estimated:</strong> {selectedCommission.estimatedPrice ? `₱${selectedCommission.estimatedPrice}` : 'N/A'}</p>
                  </fieldset>
                </div>

                <fieldset className="form-fieldset modal-fieldset">
                  <legend>Description</legend>
                  <p className="description-text">{selectedCommission.description}</p>
                </fieldset>

                {selectedCommission.refImages && selectedCommission.refImages.length > 0 && (
                  <fieldset className="form-fieldset modal-fieldset">
                    <legend>Reference Images ({selectedCommission.refImages.length})</legend>
                    <div className="ref-images-grid">
                      {selectedCommission.refImages.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url.replace('/upload/', '/upload/w_150,h_150,c_fill/')} alt={`Reference ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset className="form-fieldset modal-fieldset">
                  <legend>Admin Controls</legend>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={selectedCommission.status || 'pending'}
                        onChange={e => handleUpdateCommissionStatus(selectedCommission.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Quoted Price (₱)</label>
                      <input
                        type="number"
                        value={editingQuotedPrice}
                        onChange={e => setEditingQuotedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Enter final price"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Internal Notes</label>
                    <textarea
                      value={editingNotes}
                      onChange={e => setEditingNotes(e.target.value)}
                      rows={4}
                      placeholder="Private notes about this commission..."
                    />
                  </div>

                  <button className="btn-save" onClick={saveCommissionDetails}>
                    Save Changes
                  </button>
                </fieldset>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="admin-section">
          <h2>Site Settings</h2>
          <form onSubmit={handleUpdateSettings} className="settings-form">
            <fieldset className="form-fieldset">
              <legend>Commission Status</legend>
              <div className="form-group">
                <label>Current Status</label>
                <select
                  value={settings.commissionStatus || 'open'}
                  onChange={e => setSettings(prev => prev ? { ...prev, commissionStatus: e.target.value } : null)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="waitlist">Waitlist</option>
                </select>
                <p className="field-hint">Controls whether the commission form is visible to visitors</p>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend>Artist Profile</legend>
              <div className="form-group">
                <label>Artist Name</label>
                <input
                  type="text"
                  value={settings.artistName || ''}
                  onChange={e => setSettings(prev => prev ? { ...prev, artistName: e.target.value } : null)}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={settings.bio || ''}
                  onChange={e => setSettings(prev => prev ? { ...prev, bio: e.target.value } : null)}
                  rows={4}
                />
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend>Social Links</legend>
              <div className="form-row">
                <div className="form-group">
                  <label>Instagram Handle</label>
                  <input
                    type="text"
                    value={settings.instagram || ''}
                    onChange={e => setSettings(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                    placeholder="@username"
                  />
                </div>

                <div className="form-group">
                  <label>Discord Username</label>
                  <input
                    type="text"
                    value={settings.discord || ''}
                    onChange={e => setSettings(prev => prev ? { ...prev, discord: e.target.value } : null)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend>Pricing (PHP)</legend>
              <div className="pricing-grid">
                {(['bust', 'half', 'full', 'chibi'] as const).map(type => (
                  <div key={type} className="pricing-card">
                    <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    {(['Sketch', 'Flat', 'Rendered'] as const).map(style => {
                      const key = `${type}${style}` as keyof SiteSettings;
                      return (
                        <div key={style} className="price-input">
                          <label>{style}</label>
                          <input
                            type="number"
                            value={(settings[key] as number) || 0}
                            onChange={e => setSettings(prev =>
                              prev ? { ...prev, [key]: parseInt(e.target.value) || 0 } : null
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </fieldset>

            <button type="submit">Save Settings</button>
          </form>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import CloudinaryUploadWidget, { type CloudinaryUploadResult } from './CloudinaryUploadWidget';
import type { PortfolioItem, CommissionRequest, SiteSettings } from '../../db/schema';

interface AdminDashboardProps {
  cloudName: string;
  uploadPreset: string;
}

type Tab = 'gallery' | 'commissions' | 'settings';

export default function AdminDashboard({ cloudName, uploadPreset }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [galleryItems, setGalleryItems] = useState<PortfolioItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionRequest[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for new gallery item
  const [newItem, setNewItem] = useState({
    title: '',
    imageUrl: '',
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

  const handleImageUpload = (result: CloudinaryUploadResult) => {
    setNewItem(prev => ({
      ...prev,
      imageUrl: result.secure_url,
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
        setNewItem({ title: '', imageUrl: '', category: 'commission', altText: '' });
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
      }
    } catch (err) {
      setError('Failed to update status');
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
        >
          Gallery ({galleryItems.length})
        </button>
        <button
          className={activeTab === 'commissions' ? 'active' : ''}
          onClick={() => setActiveTab('commissions')}
        >
          Commissions ({commissions.filter(c => c.status === 'pending').length} pending)
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
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

            <div className="form-group">
              <label>Image</label>
              {newItem.imageUrl ? (
                <div className="preview-image">
                  <img src={newItem.imageUrl} alt="Preview" />
                  <button type="button" onClick={() => setNewItem(prev => ({ ...prev, imageUrl: '' }))}>
                    Remove
                  </button>
                </div>
              ) : (
                <CloudinaryUploadWidget
                  cloudName={cloudName}
                  uploadPreset={uploadPreset}
                  onUpload={handleImageUpload}
                />
              )}
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newItem.title}
                onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

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
              <label>Alt Text (for accessibility)</label>
              <input
                type="text"
                value={newItem.altText}
                onChange={e => setNewItem(prev => ({ ...prev, altText: e.target.value }))}
                placeholder="Describe the image"
              />
            </div>

            <button type="submit" disabled={!newItem.imageUrl || !newItem.title}>
              Add to Gallery
            </button>
          </form>

          <div className="gallery-list">
            <h3>Current Gallery Items</h3>
            {galleryItems.map(item => (
              <div key={item.id} className="gallery-list-item">
                <img src={`${item.imageUrl}?w=100&h=100&fit=crop`} alt={item.altText || item.title} />
                <div className="item-info">
                  <strong>{item.title}</strong>
                  <span className="category">{item.category}</span>
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
          <table className="commissions-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(commission => (
                <tr key={commission.id} className={`status-${commission.status}`}>
                  <td>
                    <strong>{commission.clientName}</strong>
                    <br />
                    <small>{commission.email}</small>
                    {commission.discord && <small><br />Discord: {commission.discord}</small>}
                  </td>
                  <td>
                    {commission.artType}
                    {commission.style && ` (${commission.style})`}
                  </td>
                  <td>
                    <select
                      value={commission.status || 'pending'}
                      onChange={e => handleUpdateCommissionStatus(commission.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td>{new Date(commission.createdAt!).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => alert(commission.description || 'No description')}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="admin-section">
          <h2>Site Settings</h2>
          <form onSubmit={handleUpdateSettings} className="settings-form">
            <div className="form-group">
              <label>Commission Status</label>
              <select
                value={settings.commissionStatus || 'open'}
                onChange={e => setSettings(prev => prev ? { ...prev, commissionStatus: e.target.value } : null)}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </div>

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

            <h3>Pricing (PHP)</h3>
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

            <button type="submit">Save Settings</button>
          </form>
        </div>
      )}
    </div>
  );
}

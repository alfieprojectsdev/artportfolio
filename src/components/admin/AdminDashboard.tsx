import { useState, useEffect } from 'react';
import CloudinaryUploadWidget, { type CloudinaryUploadResult } from './CloudinaryUploadWidget';
import type { PortfolioItem, CommissionRequest, SiteSettings } from '../../db/schema';
import { PRICED_ART_TYPES, STYLES } from '../../lib/schemas';

interface AdminDashboardProps {
  cloudName: string;
  uploadPreset: string;
}

type Tab = 'gallery' | 'commissions' | 'settings';
type CommissionStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined';
type SortField = 'createdAt' | 'clientName' | 'status';
type SortOrder = 'asc' | 'desc';
type Notice = { kind: 'success' | 'error'; message: string };

const TABS: { id: Tab; label: (counts: { gallery: number; pending: number }) => string }[] = [
  { id: 'gallery', label: ({ gallery }) => `Gallery (${gallery})` },
  { id: 'commissions', label: ({ pending }) => `Commissions (${pending} pending)` },
  { id: 'settings', label: () => 'Settings' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
];

/** Cloudinary delivery transform helper — resize on their CDN, not in the browser. */
const thumb = (url: string, transform: string) => url.replace('/upload/', `/upload/${transform}/`);

export default function AdminDashboard({ cloudName, uploadPreset }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [galleryItems, setGalleryItems] = useState<PortfolioItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionRequest[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Commission management state
  const [statusFilter, setStatusFilter] = useState<CommissionStatus>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCommission, setSelectedCommission] = useState<CommissionRequest | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingQuotedPrice, setEditingQuotedPrice] = useState<number | ''>('');
  const [pendingDelete, setPendingDelete] = useState<PortfolioItem | null>(null);

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

  const fail = (message: string) => setNotice({ kind: 'error', message });
  const succeed = (message: string) => setNotice({ kind: 'success', message });

  /** Pull the server's error message when there is one, so failures are specific. */
  const errorMessage = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body?.error ? `${fallback}: ${body.error}` : `${fallback} (HTTP ${res.status})`;
    } catch {
      return `${fallback} (HTTP ${res.status})`;
    }
  };

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

      // A non-ok response used to leave the panel silently empty, which looks
      // identical to "you have no data yet".
      const failed = [
        !galleryRes.ok && 'gallery',
        !commissionsRes.ok && 'commissions',
        !settingsRes.ok && 'settings',
      ].filter(Boolean);

      if (failed.length > 0) {
        fail(`Could not load ${failed.join(', ')}. Try reloading the page.`);
      }
    } catch (err) {
      fail('Failed to load data. Check your connection and reload.');
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
    if (isSaving) return;
    setIsSaving(true);
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
        succeed(`"${item.title}" added to the gallery.`);
      } else {
        fail(await errorMessage(res, 'Failed to add item'));
      }
    } catch (err) {
      fail('Failed to add item. Check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGalleryItem = async (item: PortfolioItem) => {
    setPendingDelete(null);
    try {
      const res = await fetch(`/api/gallery/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleryItems(prev => prev.filter(i => i.id !== item.id));
        succeed(`"${item.title}" deleted.`);
      } else {
        fail(await errorMessage(res, 'Failed to delete item'));
      }
    } catch (err) {
      fail('Failed to delete item. Check your connection.');
    }
  };

  const handleUpdateCommission = async (
    id: number,
    updates: Partial<CommissionRequest>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/commissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        fail(await errorMessage(res, 'Failed to update commission'));
        return false;
      }
      // Take the server's row rather than the optimistic patch, so fields the
      // server derives (updatedAt) stay in sync.
      const updated: CommissionRequest = await res.json();
      setCommissions(prev => prev.map(c => (c.id === id ? updated : c)));
      setSelectedCommission(prev => (prev?.id === id ? updated : prev));
      return true;
    } catch (err) {
      fail('Failed to update commission. Check your connection.');
      return false;
    }
  };

  const handleUpdateCommissionStatus = (id: number, status: string) =>
    handleUpdateCommission(id, { status });

  const openCommissionDetail = (commission: CommissionRequest) => {
    setSelectedCommission(commission);
    setEditingNotes(commission.notes || '');
    setEditingQuotedPrice(commission.quotedPrice ?? '');
  };

  const saveCommissionDetails = async () => {
    if (!selectedCommission || isSaving) return;
    setIsSaving(true);
    const success = await handleUpdateCommission(selectedCommission.id, {
      notes: editingNotes,
      quotedPrice: editingQuotedPrice === '' ? null : Number(editingQuotedPrice),
    });
    setIsSaving(false);
    if (success) succeed(`Commission #${selectedCommission.id} updated.`);
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
    if (!settings || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettings(await res.json());
        succeed('Settings saved.');
      } else {
        fail(await errorMessage(res, 'Failed to save settings'));
      }
    } catch (err) {
      fail('Failed to save settings. Check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  const artistNameIsBlank = settings?.artistName?.trim().length === 0;
  const tabCounts = {
    gallery: galleryItems.length,
    pending: commissions.filter(c => c.status === 'pending').length,
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav" role="tablist" aria-label="Dashboard sections">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label(tabCounts)}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`admin-notice ${notice.kind === 'error' ? 'is-error admin-error' : 'is-success'}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            className="notice-dismiss"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="admin-section" id="panel-gallery" role="tabpanel" aria-labelledby="tab-gallery">
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
                    <img src={thumb(newItem.imageUrl, 'w_400,q_auto,f_auto')} alt="Rendered preview" />
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
                    <img src={thumb(newItem.flatUrl, 'w_400,q_auto,f_auto')} alt="Flat preview" />
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

            <button type="submit" disabled={isSaving || !newItem.imageUrl || !newItem.title}>
              {isSaving ? 'Adding...' : 'Add to Gallery'}
            </button>
          </form>

          <div className="gallery-list">
            <h3>Current Gallery Items</h3>
            <div className="gallery-list-container">
              {galleryItems.map(item => (
                <div key={item.id} className="gallery-list-item">
                  <img src={thumb(item.imageUrl, 'w_100,h_100,c_fill')} alt={item.altText || item.title} />
                  <div className="item-info">
                    <strong>{item.title}</strong>
                    <span className="separator" aria-hidden="true">|</span>
                    <span className="category">{item.category}</span>
                    {item.flatUrl && <span className="has-slider" title="Has before/after comparison">↔</span>}
                  </div>
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => setPendingDelete(item)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Replaces window.confirm(): a native dialog blocks the page and is
              invisible to the Playwright suite. */}
          {pendingDelete && (
            <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
              <div
                className="modal-content confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-delete-title"
                onClick={e => e.stopPropagation()}
              >
                <h3 id="confirm-delete-title">Delete this item?</h3>
                <p>"{pendingDelete.title}" will be removed from the gallery. This cannot be undone.</p>
                <div className="confirm-actions">
                  <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteGalleryItem(pendingDelete)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="admin-section" id="panel-commissions" role="tabpanel" aria-labelledby="tab-commissions">
          <h2>Commission Requests</h2>

          {/* Filter bar */}
          <div className="commission-filters">
            <div className="filter-group">
              <label htmlFor="commission-status-filter">Status:</label>
              <select
                id="commission-status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as CommissionStatus)}
              >
                <option value="all">All ({commissions.length})</option>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label} ({commissions.filter(c => c.status === value).length})
                  </option>
                ))}
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
                      <span className={`status-badge is-${commission.status || 'pending'}`}>
                        {commission.status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(commission.createdAt!).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="btn-view" type="button" onClick={() => openCommissionDetail(commission)}>
                        View
                      </button>
                      <select
                        value={commission.status || 'pending'}
                        onChange={e => handleUpdateCommissionStatus(commission.id, e.target.value)}
                        className="status-select"
                        aria-label={`Status for ${commission.clientName}`}
                      >
                        {STATUS_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
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
              <div
                className="modal-content commission-detail"
                role="dialog"
                aria-modal="true"
                aria-labelledby="commission-detail-title"
                onClick={e => e.stopPropagation()}
              >
                <button className="modal-close" type="button" aria-label="Close" onClick={() => setSelectedCommission(null)}>×</button>

                <div className="modal-header">
                  <h3 id="commission-detail-title">Commission #{selectedCommission.id}</h3>
                  <span className={`status-badge large is-${selectedCommission.status || 'pending'}`}>
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
                          <img src={thumb(url, 'w_150,h_150,c_fill')} alt={`Reference ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset className="form-fieldset modal-fieldset">
                  <legend>Admin Controls</legend>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="detail-status">Status</label>
                      <select
                        id="detail-status"
                        value={selectedCommission.status || 'pending'}
                        onChange={e => handleUpdateCommissionStatus(selectedCommission.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="detail-price">Quoted Price (₱)</label>
                      <input
                        id="detail-price"
                        type="number"
                        value={editingQuotedPrice}
                        onChange={e => setEditingQuotedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Enter final price"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="detail-notes">Internal Notes</label>
                    <textarea
                      id="detail-notes"
                      value={editingNotes}
                      onChange={e => setEditingNotes(e.target.value)}
                      rows={4}
                      placeholder="Private notes about this commission..."
                    />
                  </div>

                  <button className="btn-save" type="button" disabled={isSaving} onClick={saveCommissionDetails}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </fieldset>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="admin-section" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
          <h2>Site Settings</h2>
          <form onSubmit={handleUpdateSettings} className="settings-form">
            <fieldset className="form-fieldset">
              <legend>Commission Status</legend>
              <div className="form-group">
                <label htmlFor="commission-status">Current Status</label>
                <select
                  id="commission-status"
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
                <label htmlFor="artist-name">
                  Artist Name <span className="required-marker">*</span>
                </label>
                <input
                  id="artist-name"
                  type="text"
                  value={settings.artistName || ''}
                  onChange={e => setSettings(prev => prev ? { ...prev, artistName: e.target.value } : null)}
                  required
                  minLength={1}
                  placeholder="Enter your artist name"
                  className={artistNameIsBlank ? 'is-invalid' : undefined}
                  aria-invalid={artistNameIsBlank || undefined}
                  aria-describedby={artistNameIsBlank ? 'artist-name-error' : undefined}
                />
                {artistNameIsBlank && (
                  <p className="field-error" id="artist-name-error">Artist name is required</p>
                )}
                <p className="field-hint">Your name will appear in the site title and header</p>
              </div>

              <div className="form-group">
                <label htmlFor="artist-bio">Bio</label>
                <textarea
                  id="artist-bio"
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
                  <label htmlFor="instagram">Instagram Handle</label>
                  <input
                    id="instagram"
                    type="text"
                    value={settings.instagram || ''}
                    onChange={e => setSettings(prev => prev ? { ...prev, instagram: e.target.value } : null)}
                    placeholder="@username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="discord">Discord Username</label>
                  <input
                    id="discord"
                    type="text"
                    value={settings.discord || ''}
                    onChange={e => setSettings(prev => prev ? { ...prev, discord: e.target.value } : null)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend>Pricing (PHP)</legend>
              <p className="field-hint">
                These prices drive the public rate cards and the estimate shown on the commission form.
              </p>
              <div className="pricing-grid">
                {PRICED_ART_TYPES.map(type => (
                  <div key={type} className="pricing-card">
                    <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    {STYLES.map(style => {
                      const key = `${type}${style.charAt(0).toUpperCase()}${style.slice(1)}` as keyof SiteSettings;
                      const inputId = `price-${type}-${style}`;
                      return (
                        <div key={style} className="price-input">
                          <label htmlFor={inputId}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </label>
                          <input
                            id={inputId}
                            type="number"
                            min={0}
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

            <button
              type="submit"
              disabled={isSaving || !settings.artistName || settings.artistName.trim().length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

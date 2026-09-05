import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/admin/settings');
        setSettings(data.data);
      } catch (e) {
        setMessage(e.message);
        setSuccess(false);
      }
      setLoading(false);
    })();
  }, []);

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setSuccess(null);

    try {
      if (Number(settings.minimum_transfer_amount) > Number(settings.maximum_transfer_amount)) {
        throw new Error('Minimum transfer amount cannot be greater than maximum transfer amount.');
      }

      const data = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: {
          ...settings,
          minimum_transfer_amount: Number(settings.minimum_transfer_amount),
          maximum_transfer_amount: Number(settings.maximum_transfer_amount),
          transaction_fee: Number(settings.transaction_fee),
        },
      });

      setSettings(data.data);
      setMessage('Settings updated successfully.');
      setSuccess(true);
    } catch (e) {
      setMessage(e.message);
      setSuccess(false);
    }

    setSaving(false);
  };

  if (loading) return <div className="loading-text">Loading settings...</div>;
  if (!settings) return <div className="loading-text">{message}</div>;

  return (
    <div>
      <h1>Settings</h1>
      <p className="page-sub">Manage system-wide banking rules and preferences.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 760px)', gap: 18 }}>
        <div className="table-wrap" style={{ padding: 24 }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Transaction settings</h2>
            <p style={{ margin: '6px 0 0', color: '#77758f', fontSize: 13 }}>
              These limits are applied to transfers made from the mobile banking app.
            </p>
          </div>

          <form onSubmit={save}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}>
              <div className="field">
                <label>Minimum Transfer Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.minimum_transfer_amount ?? ''}
                  onChange={(e) => update('minimum_transfer_amount', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Maximum Transfer Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.maximum_transfer_amount ?? ''}
                  onChange={(e) => update('maximum_transfer_amount', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Transaction Fee ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.transaction_fee ?? ''}
                  onChange={(e) => update('transaction_fee', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Default Currency</label>
                <select
                  value={settings.default_currency || 'USD'}
                  onChange={(e) => update('default_currency', e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </select>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: '#f7f6ff',
              border: '1px solid #e8e6ff'
            }}>
              <div style={{ fontWeight: 700, color: '#3f3b78', marginBottom: 5 }}>
                Transfer limit
              </div>
              <div style={{ fontSize: 13, color: '#77758f', lineHeight: 1.5 }}>
                Customers cannot send more than the maximum transfer amount configured above.
                The API also enforces this limit, so changing it here affects mobile transfers.
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 20,
              padding: 16,
              border: '1px solid #ecebf2',
              borderRadius: 12
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#29273d' }}>Maintenance Mode</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#77758f' }}>
                  Temporarily restrict normal banking operations.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!settings.maintenance_mode}
                  onChange={(e) => update('maintenance_mode', e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                />
                <span style={{
                  width: 48,
                  height: 26,
                  borderRadius: 999,
                  background: settings.maintenance_mode ? '#4B3FE4' : '#d9d8e2',
                  display: 'block',
                  position: 'relative',
                  transition: 'background .2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: 3,
                    left: settings.maintenance_mode ? 25 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                    transition: 'left .2s'
                  }} />
                </span>
              </label>
            </div>

            {!!message && (
              <div
                className={success ? 'success-text' : 'error-text'}
                style={{ marginTop: 16 }}
              >
                {message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

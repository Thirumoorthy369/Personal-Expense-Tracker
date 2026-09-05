import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, UserPlus } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function InviteMemberDialog({ onClose }) {
  const { inviteMember, activeWorkspace } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter a user email address');

    setSaving(true);
    setError(null);

    try {
      await inviteMember(email.trim(), role);
      setMessage(`Invited ${email} as ${role} to ${activeWorkspace.name}`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send workspace invite');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer (Read-only access)' },
    { value: 'admin', label: 'Admin (Full CRUD access)' }
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-base font-heading font-semibold text-foreground">Invite Member</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {message && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{message}</div>}
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">User Email</label>
            <input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Access Role</label>
            <CustomSelect
              options={roleOptions}
              value={role}
              onChange={setRole}
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Close
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Sending...' : 'Send Workspace Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/AuthLayout';
import { Lock } from 'lucide-react';

export function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    setError(null);

    try {
      await resetPassword(password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Set your new secure vault password">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

        <div className="space-y-1">
          <label className="font-semibold text-foreground">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90"
        >
          {loading ? 'Updating Password...' : 'Update Password & Login'}
        </button>
      </form>
    </AuthLayout>
  );
}

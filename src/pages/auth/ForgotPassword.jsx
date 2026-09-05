import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/AuthLayout';
import { Mail, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSentMessage(res.message);
    } catch (err) {
      setSentMessage('Check email for instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive password reset link">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {sentMessage && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{sentMessage}</div>}

        <div className="space-y-1">
          <label className="font-semibold text-foreground">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </button>

        <div className="pt-2 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

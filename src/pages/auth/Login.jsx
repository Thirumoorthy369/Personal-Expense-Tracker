import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/AuthLayout';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials or account suspended.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to access your personal financial vault">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium">{error}</div>}

        <div className="space-y-1">
          <label className="font-semibold text-foreground">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
            <input
              type="email"
              placeholder="mr.thirumoorthys@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary focus:border-primary font-medium"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-primary hover:underline text-[11px] font-medium">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary focus:border-primary font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-bold rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
        >
          {loading ? 'Authenticating...' : 'Sign In to Vault'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-muted-foreground pt-2">
          Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register here</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

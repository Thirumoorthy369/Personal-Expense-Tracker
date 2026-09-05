import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/AuthLayout';
import { Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';

export function Register() {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Register form, 2 = OTP verification
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(email, password, displayName);
      setStep(2); // Advance to OTP verification
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await verifyOtp(otpCode);
      // Hard redirect to login (Never auto-login after register)
      window.location.href = '/login?registered=true';
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Create Account' : 'Verify Email OTP'}
      subtitle={step === 1 ? 'Start managing your finances with zero AI & 100% privacy' : `Enter the 6-digit verification code sent to ${email}`}
    >
      {step === 1 ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? 'Registering...' : 'Register & Send OTP'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Already registered? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1 text-center">
            <label className="font-semibold text-foreground">6-Digit Verification OTP</label>
            <div className="relative max-w-xs mx-auto">
              <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-primary" />
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-center font-mono text-base tracking-widest"
                required
              />
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">(Demo OTP: 123456 or 000000)</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Registration'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import authService from '../../services/authService';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.verifyEmail(email, code);
      setSuccess('Email verified successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is missing. Please sign up again.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsResending(true);
    try {
      await authService.resendVerification(email);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card variant="glass" className="p-6 sm:p-8 md:p-10 border-none shadow-2xl max-w-lg w-full mx-auto text-center">
      <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center">
        <Mail className="w-8 sm:w-10 h-8 sm:h-10 text-primary" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] mb-3 tracking-tight">Verify Email</h1>
      <p className="text-sm sm:text-base text-[var(--text-muted)] font-medium mb-8">
        We've sent a 6-digit verification code to <span className="text-[var(--text)] font-bold">{email}</span>.
      </p>

      <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 text-left">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--text-muted)]">Verification Code</label>
          <div className="relative group">
            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`w-full bg-surface/50 border-2 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all font-medium text-center text-lg tracking-[0.5em] ${error ? 'border-error' : 'border-[var(--border)]'}`}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-error/10 border-2 border-error/30 text-error text-sm font-semibold text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 rounded-2xl bg-green-500/10 border-2 border-green-500/30 text-green-600 text-sm font-semibold text-center">
            {success}
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full py-4 sm:py-5 rounded-2xl shadow-xl shadow-primary/20 text-base sm:text-lg group mt-6">
          Verify Account
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>

      <div className="mt-8 space-y-4">
        <button
          onClick={handleResend}
          disabled={isResending}
          className="text-sm font-bold text-[var(--text-muted)] hover:text-primary transition-colors disabled:opacity-50"
        >
          {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
        </button>
        <p className="text-center text-xs sm:text-sm font-medium text-[var(--text-muted)]">
          <Link to="/login" className="text-primary font-black hover:underline tracking-tight">
            Back to login
          </Link>
        </p>
      </div>
    </Card>
  );
}

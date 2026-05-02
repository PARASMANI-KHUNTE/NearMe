import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import authService from '../../services/authService';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ForgotForm = z.infer<typeof forgotPasswordSchema>;
type ResetForm = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register: forgotRegister,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: resetRegister,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onForgotSubmit = async (data: ForgotForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.forgotPassword(data.email);
      setMessage(result.message);
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetForm) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.resetPassword(data.token, data.password);
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="w-full max-w-2xl mx-auto p-6 sm:p-8 md:p-10">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text)] mb-2">
          {step === 'forgot' ? 'Reset Password' : 'Enter Token'}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)]">
          {step === 'forgot'
            ? 'Enter your email to receive a reset token'
            : 'Check your email for the token'}
        </p>
      </div>

      {message && !error && (
        <div className="mb-6 p-4 bg-success/10 border-2 border-success/30 rounded-2xl text-success text-sm font-semibold flex items-center gap-3">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error/10 border-2 border-error/30 rounded-2xl text-error text-sm font-semibold flex items-center gap-3">
          <span>⚠</span>
          {error}
        </div>
      )}

      {step === 'forgot' ? (
        <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-5 sm:space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...forgotRegister('email')}
            error={forgotErrors.email?.message}
          />
          <Button type="submit" isLoading={isLoading} className="w-full py-3 sm:py-4 mt-6 font-semibold">
            Send Reset Token
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-5 sm:space-y-6">
          <Input
            label="Reset Token"
            placeholder="Paste token from email"
            {...resetRegister('token')}
            error={resetErrors.token?.message}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="8+ chars, upper/lowercase, number"
            {...resetRegister('password')}
            error={resetErrors.password?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Must match above"
            {...resetRegister('confirmPassword')}
            error={resetErrors.confirmPassword?.message}
          />
          <Button type="submit" isLoading={isLoading} className="w-full py-3 sm:py-4 mt-6 font-semibold">
            Reset Password
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-xs sm:text-sm text-[var(--text-muted)]">
        {step === 'forgot' ? (
          <>
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--primary)] hover:underline font-bold">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Didn't receive the token?{' '}
            <button
              onClick={() => setStep('forgot')}
              className="text-[var(--primary)] hover:underline font-bold transition-colors"
            >
              Request again
            </button>
          </>
        )}
      </p>
    </Card>
  );
}

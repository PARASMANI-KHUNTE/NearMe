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
    <Card variant="glass" className="w-full p-6 md:p-8 max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
          {step === 'forgot' ? 'Reset Password' : 'Enter Token'}
        </h1>
        <p className="text-[var(--text-muted)]">
          {step === 'forgot'
            ? 'Enter your email to receive a reset token'
            : 'Check your email for the token'}
        </p>
      </div>

      {message && !error && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {step === 'forgot' ? (
        <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...forgotRegister('email')}
            error={forgotErrors.email?.message}
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Send Reset Token
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
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
          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset Password
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {step === 'forgot' ? (
          <>
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--primary)] hover:underline font-medium">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Didn't receive the token?{' '}
            <button
              onClick={() => setStep('forgot')}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              Request again
            </button>
          </>
        )}
      </p>
    </Card>
  );
}

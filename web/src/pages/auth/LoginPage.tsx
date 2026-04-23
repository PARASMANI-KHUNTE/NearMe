import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import authService from '../../services/authService';
import { GoogleAuthService } from '../../services/googleAuthService';
import { env } from '../../config/env';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [googleInitError, setGoogleInitError] = useState<string | null>(null);
   
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let isMounted = true;

    (window as any).handleGoogleCredential = async (idToken: string) => {
      try {
        setIsLoading(true);
        setGoogleInitError(null);

        await authService.loginWithGoogle(idToken);
        navigate('/dashboard');
      } catch (error: any) {
        const message =
          (typeof error?.message === 'string' && error.message) ||
          'Google login failed';
        setError('root', { message });
      } finally {
        setIsLoading(false);
      }
    };

    if (!env.googleClientId) {
      setGoogleInitError('Missing VITE_GOOGLE_CLIENT_ID for web OAuth');
      return () => {
        delete (window as any).handleGoogleCredential;
      };
    }

    GoogleAuthService.initGoogleAuth()
      .then(() => {
        if (!isMounted) return;
        GoogleAuthService.renderGoogleButton('google-signin-button');
      })
      .catch((error) => {
        if (!isMounted) return;
        setGoogleInitError(
          (typeof error?.message === 'string' && error.message) ||
            'Failed to initialize Google login'
        );
      });

    return () => {
      isMounted = false;
      delete (window as any).handleGoogleCredential;
    };
  }, [navigate, setError]);

  const onSubmit = async (_data: LoginForm) => {
    try {
      setIsLoading(true);
      navigate('/dashboard');
    } catch (error: any) {
      setError('root', { message: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="w-full p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
          <span className="text-3xl">📍</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">Welcome Back</h1>
        <p className="text-[var(--text-muted)]">Sign in to continue</p>
      </div>

      {googleInitError ? (
        <div className="mb-6">
          <Button variant="secondary" disabled className="w-full">
            Continue with Google
          </Button>
          <p className="mt-2 text-sm text-[var(--error)]">{googleInitError}</p>
        </div>
      ) : (
        <div className="w-full mb-6">
          <div id="google-signin-button" className="w-full flex justify-center" />
          {isLoading && (
            <p className="mt-3 text-sm text-[var(--text-muted)] text-center">
              Signing you in...
            </p>
          )}
        </div>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--surface)] text-[var(--text-muted)]">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        {errors.root && (
          <p className="text-sm text-[var(--error)]">{errors.root.message}</p>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-[var(--primary)] hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

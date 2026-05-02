import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import authService from '../../services/authService';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (error: unknown) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  return (
      <Card variant="glass" className="p-6 sm:p-8 md:p-10 border-none shadow-2xl max-w-2xl w-full mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-8 sm:w-10 h-8 sm:h-10 text-primary" />
        </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] mb-3 tracking-tight">Create Identity</h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-medium">Join the network and stay connected privately.</p>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--text-muted)]">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="John Doe"
                  className={`w-full bg-surface/50 border-2 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all font-medium ${errors.name ? 'border-error' : 'border-[var(--border)]'}`}
                {...register('name')}
              />
            </div>
              {errors.name && <p className="text-xs font-semibold text-error mt-2 ml-1 flex items-center gap-1">⚠ {errors.name.message}</p>}
          </div>

          <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--text-muted)]">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="name@company.com"
                  className={`w-full bg-surface/50 border-2 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all font-medium ${errors.email ? 'border-error' : 'border-[var(--border)]'}`}
                {...register('email')}
              />
            </div>
              {errors.email && <p className="text-xs font-semibold text-error mt-2 ml-1 flex items-center gap-1">⚠ {errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--text-muted)]">Choose a strong password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
                className={`w-full bg-surface/50 border-2 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all font-medium ${errors.password ? 'border-error' : 'border-[var(--border)]'}`}
              {...register('password')}
            />
          </div>
            {errors.password && <p className="text-xs font-semibold text-error mt-2 ml-1 flex items-center gap-1">⚠ {errors.password.message}</p>}
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--text-muted)]">Confirm security key</label>
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
                className={`w-full bg-surface/50 border-2 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-all font-medium ${errors.confirmPassword ? 'border-error' : 'border-[var(--border)]'}`}
              {...register('confirmPassword')}
            />
          </div>
            {errors.confirmPassword && <p className="text-xs font-semibold text-error mt-2 ml-1 flex items-center gap-1">⚠ {errors.confirmPassword.message}</p>}
        </div>

        {errors.root && (
            <div className="p-4 rounded-2xl bg-error/10 border-2 border-error/30 text-error text-sm font-semibold flex items-center gap-3">
             <ShieldCheck className="w-5 h-5" />
             {errors.root.message}
          </div>
        )}

          <Button type="submit" isLoading={isSubmitting} className="w-full py-4 sm:py-5 rounded-2xl shadow-xl shadow-primary/20 text-base sm:text-lg group mt-6">
          Create Access Account
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>

        <p className="mt-8 sm:mt-10 text-center text-xs sm:text-sm font-medium text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-black hover:underline tracking-tight">
          Authorize Identity
        </Link>
      </p>
    </Card>
  );
}

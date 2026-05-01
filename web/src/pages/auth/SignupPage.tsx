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
    <Card variant="glass" className="p-10 border-none shadow-2xl">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black text-[var(--text)] mb-3 tracking-tight">Create Identity</h1>
        <p className="text-[var(--text-muted)] font-medium">Join the network and stay connected privately.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest ml-1 text-[var(--text-muted)]">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full bg-surface/50 border-[var(--border)] border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium ${errors.name ? 'border-error' : ''}`}
                {...register('name')}
              />
            </div>
            {errors.name && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest ml-1 text-[var(--text-muted)]">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="name@company.com"
                className={`w-full bg-surface/50 border-[var(--border)] border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium ${errors.email ? 'border-error' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-[var(--text-muted)]">Choose a strong password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full bg-surface/50 border-[var(--border)] border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium ${errors.password ? 'border-error' : ''}`}
              {...register('password')}
            />
          </div>
          {errors.password && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-[var(--text-muted)]">Confirm security key</label>
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full bg-surface/50 border-[var(--border)] border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium ${errors.confirmPassword ? 'border-error' : ''}`}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.confirmPassword.message}</p>}
        </div>

        {errors.root && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-bold flex items-center gap-3">
             <ShieldCheck className="w-5 h-5" />
             {errors.root.message}
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full py-7 rounded-2xl shadow-xl shadow-primary/20 text-lg group">
          Create Access Account
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>

      <p className="mt-10 text-center text-sm font-medium text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-black hover:underline tracking-tight">
          Authorize Identity
        </Link>
      </p>
    </Card>
  );
}

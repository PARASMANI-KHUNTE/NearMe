import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Bell, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import heroBg from '../../assets/hero_bg.png';
import { NearMeLogo } from '../../components/branding/NearMeLogo';

export function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
      <div className="mesh-bg opacity-40" />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-none">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center">
            <NearMeLogo size="md" />
          </motion.div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="rounded-full px-6">Dashboard</Button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  Log in
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full px-6 group">
                    Join Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center max-w-4xl z-10">
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-primary">
            <Zap className="w-4 h-4 fill-primary" />
            <span>The Privacy-First Connection Engine</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-[var(--text)] mb-8 leading-tight">
            FRIENDS ARE <br />
            <span className="text-primary font-black">NEARBY</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
            NearMe uses advanced proximity intelligence to notify you when your circle is close,
            without ever broadcasting your exact coordinates. Connection meets privacy.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="rounded-full px-8 sm:px-10 w-full sm:w-auto font-bold shadow-primary-glow">
                Start Exploring
              </Button>
            </Link>
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-3 sm:border-4 border-[var(--background)] bg-[var(--surface)] overflow-hidden flex-shrink-0">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                </div>
              ))}
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-3 sm:border-4 border-[var(--background)] glass flex items-center justify-center text-xs font-bold flex-shrink-0">
                +1k
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image / Visualization */}
        <motion.div initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="mt-16 sm:mt-20 w-full max-w-6xl relative px-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent z-10" />
          <img src={heroBg} alt="Proximity Visualization" className="rounded-2xl sm:rounded-3xl shadow-2xl border border-[var(--border)] animate-float w-full h-auto" />
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-24 md:py-32 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          <FeatureCard icon={<Bell className="w-8 h-8" />} title="Instant Proximity" description="Get pinged immediately when a friend enters your custom radius. Perfect for spontaneous meetups." />
          <FeatureCard icon={<Shield className="w-8 h-8" />} title="Privacy Lockdown" description="We use hashing and fuzzy location boundaries to ensure your exact home/office is never visible." />
          <FeatureCard icon={<Users className="w-8 h-8" />} title="Mutual Consent" description="Both you and your friend must agree to share proximity for alerts to trigger. Zero tracking bloat." />
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[var(--text-muted)] text-sm">© 2026 NearMe Proximity Labs. All rights reserved.</p>
          <div className="flex gap-8 text-sm text-[var(--text-muted)]">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div whileHover={{ y: -10 }} className="interactive-card glass p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-[2.5rem] flex flex-col gap-4 sm:gap-6 h-full">
      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export default LandingPage;

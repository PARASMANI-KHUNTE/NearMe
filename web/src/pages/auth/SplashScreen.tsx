import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export function SplashScreen() {
  const navigate = useNavigate();
  const { token, setToken } = useAuthStore();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout>;
    let animationTimer: ReturnType<typeof setTimeout>;

    const verifyAndNavigate = async () => {
      if (token) {
        try {
          await api.get('/api/users/profile');
        } catch {
          setToken(null);
        }
      }
      
      redirectTimer = setTimeout(() => {
        setAnimationComplete(true);
        animationTimer = setTimeout(() => {
          const isAuth = useAuthStore.getState().isAuthenticated;
          navigate(isAuth ? '/dashboard' : '/landing');
        }, 500);
      }, 2000);
    };

    verifyAndNavigate();

    return () => {
      clearTimeout(redirectTimer);
      clearTimeout(animationTimer);
    };
  }, [navigate, setToken, token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Logo Animation */}
      <div className="relative mb-8">
        {/* Pulse Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-primary animate-pulse-ring" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '0.5s' }}>
          <div className="w-32 h-32 rounded-full border border-primary/50 animate-pulse-ring" />
        </div>
        
        {/* Logo Icon */}
        <div 
          className={`relative w-20 h-20 bg-primary rounded-2xl flex items-center justify-center transition-all duration-500 ${
            animationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          style={{ 
            transform: animationComplete ? 'scale(1)' : 'scale(0.9)',
            opacity: animationComplete ? 1 : 0 
          }}
        >
          <span className="text-3xl">📍</span>
        </div>
      </div>

      {/* App Name */}
      <h1 
        className={`text-4xl font-bold text-text mb-2 transition-all duration-500 ${
          animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        NearMe
      </h1>
      
      <p 
        className={`text-gray-400 transition-all duration-500 delay-200 ${
          animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Know when friends are nearby
      </p>

      {/* Loading Indicator */}
      <div 
        className={`mt-8 transition-all duration-500 delay-300 ${
          animationComplete ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

import { createBrowserRouter, redirect } from 'react-router-dom';
import AppLayout from './AppLayout';
import AuthLayout from './AuthLayout';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../pages/auth/SplashScreen';
import { LandingPage } from '../pages/auth/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { FriendsPage } from '../pages/friends/FriendsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { MapPage } from '../pages/map/MapPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SplashScreen />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    element: <AppLayout />,
    loader: () => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (!isAuthenticated) {
        throw redirect('/login');
      }
      return null;
    },
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/friends',
        element: <FriendsPage />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/map',
        element: <MapPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
    ],
  },
]);
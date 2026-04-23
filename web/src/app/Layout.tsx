import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Outlet />
    </div>
  );
}
import { RouterProvider as RRouterProvider } from 'react-router-dom';
import { router } from './router';

export function RouterProvider() {
  return <RRouterProvider router={router} />;
}
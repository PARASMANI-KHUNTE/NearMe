import { RouterProvider } from './app/providers';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider />
    </ErrorBoundary>
  );
}

export default App;
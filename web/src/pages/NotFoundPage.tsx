import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <Card variant="glass" className="max-w-md w-full p-8 sm:p-10 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary mb-3">
          Error 404
        </span>
        <h1 className="text-3xl font-black text-[var(--text)] mb-3">Lost in Transit</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
          The coordinates you are looking for don't exist or have moved beyond detection radius.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
export default NotFoundPage;

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

interface ErrorPageProps {
  errorMessage?: string;
  path?: string;
  status?: number;
}

export default function ErrorPage({ errorMessage, path, status }: ErrorPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-background p-4"
    >
      <div className="max-w-2xl text-center">
        <div className="mb-6">
          <AlertCircle className="h-24 w-24 mx-auto text-destructive" />
        </div>
        <h1 className="text-9xl font-light mb-4 text-destructive">Error</h1>
        <h2 className="text-2xl font-normal mb-6 text-muted-foreground">
          Something Went Wrong
        </h2>

        {errorMessage && (
          <div className="bg-muted p-4 rounded-lg mb-4 font-mono text-sm text-left">
            {errorMessage}
          </div>
        )}

        {path && (
          <div className="bg-muted p-4 rounded-lg mb-4 font-mono text-sm text-left">
            Path: {path}
          </div>
        )}

        {status && (
          <div className="bg-muted p-4 rounded-lg mb-4 font-mono text-sm text-left">
            Status: {status}
          </div>
        )}

        <p className="text-lg mb-4 text-muted-foreground">
          We are sorry for the inconvenience. Our technical team has been notified.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-lg"
        >
          <Home className="h-5 w-5" />
          Return to Homepage
        </Link>
      </div>
    </motion.div>
  );
}

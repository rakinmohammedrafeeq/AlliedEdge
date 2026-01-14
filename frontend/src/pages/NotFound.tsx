import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-background p-4"
    >
      <div className="max-w-2xl text-center">
        <h1 className="text-9xl font-light mb-4">404</h1>
        <h2 className="text-2xl font-normal mb-6 text-muted-foreground">
          Oops! Page Not Found.
        </h2>
        <p className="text-lg mb-8 text-muted-foreground">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
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

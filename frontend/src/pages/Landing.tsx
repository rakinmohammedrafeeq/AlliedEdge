// TODO: REPLACE THIS LANDING PAGE WITH AN ELEGANT, THEMATIC, AND WELL-DESIGNED LANDING PAGE RELEVANT TO THE PROJECT
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4 text-center">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="AlliedEdge"
              width={64}
              height={64}
              className="rounded-lg mb-8 mt-24"
            />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to AlliedEdge</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your community feed for posts, announcements, and chat.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

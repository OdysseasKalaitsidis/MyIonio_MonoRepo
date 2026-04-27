import { motion } from "framer-motion";
import { Button } from "../Button";

type CallToActionProps = {
  isAuthenticated: boolean;
  onPrimaryAction: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
};

export function CallToAction({
  isAuthenticated,
  onPrimaryAction,
  onSignIn,
  onSignUp,
}: CallToActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-4 pt-4"
    >
      {isAuthenticated ? (
        <Button
          onClick={onPrimaryAction}
          className="bg-ionian-blue hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg shadow-blue-500/20"
        >
          Go to Dashboard
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <p className="text-lg text-slate-600 dark:text-gray-400 mb-2 sm:mb-0 transition-colors">
            Want to save your results?
          </p>
          <div className="flex gap-4">
            <Button
              onClick={onSignIn}
              className="bg-ionian-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
            >
              Sign In
            </Button>
            <Button
              onClick={onSignUp}
              className="bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

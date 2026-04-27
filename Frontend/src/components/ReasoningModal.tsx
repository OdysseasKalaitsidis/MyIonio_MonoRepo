import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import type { RecommendationDto } from "./../features/quiz/models";

interface ReasoningModalProps {
  result: RecommendationDto;
  isOpen: boolean;
  onClose: () => void;
}

export function ReasoningModal({
  result,
  isOpen,
  onClose,
}: ReasoningModalProps) {
  const [step, setStep] = useState<"majors" | "toolboxes" | "warning">(
    "majors"
  );

  const majorReasons = result.reasoning?.majorReasons || [];
  const toolboxReasons = result.reasoning?.toolboxReasons || [];

  const showWarning = result.confidenceLevel === "Low";

  const handleNext = () => {
    if (step === "majors") {
      if (toolboxReasons.length > 0) setStep("toolboxes");
      else if (showWarning) setStep("warning");
      else onClose();
    } else if (step === "toolboxes") {
      if (showWarning) setStep("warning");
      else onClose();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step === "toolboxes") setStep("majors");
    else if (step === "warning") {
      if (toolboxReasons.length > 0) setStep("toolboxes");
      else setStep("majors");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-deep-navy border border-slate-200 dark:border-white/10 rounded-2xl w-[95%] md:w-[70%] max-h-[90vh] flex flex-col p-6 md:p-10 relative overflow-hidden shadow-2xl text-slate-900 dark:text-white"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Step Indicator */}
            <div className="text-center mb-6 text-text-muted font-medium">
              {step === "majors" && `Step 1 of ${showWarning ? 3 : 2}: Majors`}
              {step === "toolboxes" &&
                `Step 2 of ${showWarning ? 3 : 2}: Toolboxes`}
              {step === "warning" && "Step 3 of 3: Attention"}
            </div>

            {/* Modal Content */}
            <div className="flex flex-col flex-1 overflow-y-auto space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white">
                Why These Recommendations?
              </h2>

              {/* Majors Step */}
              {step === "majors" && (
                <div className="space-y-6 flex flex-col flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold text-ionian-blue text-center">
                    Major Recommendations
                  </h3>
                  {majorReasons.map((reason, idx) => (
                    <p
                      key={idx}
                      className="text-lg md:text-xl text-slate-700 dark:text-gray-300 text-center leading-relaxed"
                    >
                      {reason}
                    </p>
                  ))}
                  <div className="mt-auto flex justify-end pt-6">
                    <Button
                      onClick={handleNext}
                      className="bg-ionian-blue hover:bg-blue-600 text-white px-10 py-3 rounded-xl text-lg font-medium shadow-lg shadow-blue-500/20"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Toolboxes Step */}
              {step === "toolboxes" && (
                <div className="space-y-6 flex flex-col flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold text-purple-500 text-center">
                    Toolbox Recommendations
                  </h3>
                  {toolboxReasons.map((reason, idx) => (
                    <p
                      key={idx}
                      className="text-lg md:text-xl text-slate-700 dark:text-gray-300 text-center leading-relaxed"
                    >
                      {reason}
                    </p>
                  ))}
                  <div className="mt-auto flex justify-between pt-6">
                    <Button
                      onClick={handlePrev}
                      className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-8 py-3 rounded-xl text-lg font-medium hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-ionian-blue hover:bg-blue-600 text-white px-10 py-3 rounded-xl text-lg font-medium shadow-lg shadow-blue-500/20"
                    >
                      {showWarning ? "Next" : "View Results"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Warning Step */}
              {step === "warning" && showWarning && (
                <div className="space-y-6 flex flex-col flex-1 justify-center text-center">
                  <p className="text-amber-500 text-xl font-medium leading-relaxed">
                    Confidence in these results is{" "}
                    <span className="font-bold">low</span>. We recommend
                    discussing your answers with a mentor or teacher to validate
                    and understand your assessment.
                  </p>
                  <div className="mt-auto flex justify-between pt-6">
                    <Button
                      onClick={handlePrev}
                      className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-8 py-3 rounded-xl text-lg font-medium hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-ionian-blue hover:bg-blue-600 text-white px-10 py-3 rounded-xl text-lg font-medium shadow-lg shadow-blue-500/20"
                    >
                      View Results
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
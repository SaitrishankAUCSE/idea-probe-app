"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface AILoadingAnimationProps {
  isVisible: boolean;
}

const analysisSteps = [
  { label: "Parsing startup idea...", delay: 0 },
  { label: "Scanning competitors via Google...", delay: 2000 },
  { label: "Evaluating market size...", delay: 4500 },
  { label: "Analyzing feasibility & risks...", delay: 7000 },
  { label: "Assessing scalability potential...", delay: 9500 },
  { label: "Detecting competitive moats...", delay: 12000 },
  { label: "Generating founder insights...", delay: 14500 },
  { label: "Calculating validation score...", delay: 17000 },
  { label: "Preparing your report...", delay: 19500 },
];

export function AILoadingAnimation({ isVisible }: AILoadingAnimationProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTo({
        top: stepsContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeStep, completedSteps]);

  useEffect(() => {
    if (!isVisible) {
      setCompletedSteps([]);
      setActiveStep(0);
      setProgress(0);
      return;
    }

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // Never reach 100% until actual completion
        return prev + 0.4;
      });
    }, 100);

    // Step animations
    const timers = analysisSteps.map((step, index) => {
      return setTimeout(() => {
        setActiveStep(index);
        if (index > 0) {
          setCompletedSteps((prev) => [...prev, index - 1]);
        }
      }, step.delay);
    });

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg mx-4"
          >
            {/* Glowing orb */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-primary/30 blur-xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.05))",
                    boxShadow: "0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 40px rgba(139, 92, 246, 0.2)",
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="4" strokeDasharray="4 2" />
                      <circle cx="12" cy="12" r="8" strokeDasharray="2 4" opacity="0.5" />
                    </svg>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fff 0%, rgba(96, 165, 250, 0.9) 100%)" }}
            >
              Building Intelligence Report
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-foreground-tertiary text-sm text-center mb-8"
            >
              Our AI is searching the web and running deep analysis...
            </motion.p>

            {/* Progress bar */}
            <div className="mb-6 mx-4">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Steps */}
            <div 
              ref={stepsContainerRef}
              className="space-y-1 mx-4 max-h-[280px] overflow-hidden relative pb-10"
              style={{ scrollBehavior: 'smooth' }}
            >
              {analysisSteps.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isActive = activeStep === index;
                const isVisible = index <= activeStep + 1;

                if (!isVisible) return null;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : isCompleted
                        ? "opacity-60"
                        : "opacity-30"
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20" />
                    )}
                    <span
                      className={`text-sm ${
                        isActive
                          ? "text-foreground font-medium"
                          : isCompleted
                          ? "text-foreground-secondary"
                          : "text-foreground-tertiary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

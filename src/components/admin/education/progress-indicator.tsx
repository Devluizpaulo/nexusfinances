"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  onStepClick: (stepId: string) => void;
}

export function ProgressIndicator({
  steps,
  currentStepIndex,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <Card className="border-dashed overflow-hidden">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="flex items-center flex-1 w-full">
                  <motion.button
                    onClick={() => onStepClick(step.id)}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all shadow-sm",
                      currentStepIndex >= index
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-muted-foreground/30 bg-muted hover:border-primary/50"
                    )}
                  >
                    {currentStepIndex > index ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : currentStepIndex === index ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </motion.button>
                  
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: currentStepIndex > index ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className={cn(
                        "h-1 flex-1 mx-2 rounded-full origin-left",
                        currentStepIndex > index ? "bg-primary" : "bg-muted-foreground/20"
                      )}
                    />
                  )}
                </div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="mt-3 text-center"
                >
                  <div className="text-xs font-semibold">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Completion Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between pt-2 border-t"
          >
            <span className="text-xs text-muted-foreground">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Completo
            </span>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

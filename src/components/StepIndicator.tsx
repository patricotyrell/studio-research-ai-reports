
import React from 'react';
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center mb-2 px-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                index + 1 < currentStep 
                  ? "bg-research-700 text-white"
                  : index + 1 === currentStep
                    ? "bg-research-500 text-white"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {index + 1}
            </div>
            <div 
              className={cn(
                "text-xs font-medium",
                index + 1 === currentStep ? "text-research-700" : "text-gray-500"
              )}
            >
              {step}
            </div>
            
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "absolute top-4 w-full h-0.5 left-1/2",
                  index + 1 < currentStep ? "bg-research-700" : "bg-gray-200"
                )}
                style={{ width: 'calc(100% - 2rem)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;

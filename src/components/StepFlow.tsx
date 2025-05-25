
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';

interface StepFlowProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onComplete: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  actionInProgress?: boolean;
  completeButtonText?: string;
  onSkipToSummary?: () => void;
  currentStep?: number;
  totalSteps?: number;
  hideNavigation?: boolean;
}

const StepFlow: React.FC<StepFlowProps> = ({
  title,
  description,
  children,
  onComplete,
  onCancel,
  showBackButton = true,
  onBack,
  actionInProgress = false,
  completeButtonText = "Apply Changes",
  onSkipToSummary,
  currentStep,
  totalSteps,
  hideNavigation = false
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        
        {/* Navigation buttons at bottom right of content area */}
        {!hideNavigation && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {/* Left side - only back button if needed */}
              {showBackButton && onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack} 
                  disabled={actionInProgress} 
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            
            {/* Right side - main navigation buttons */}
            <div className="flex items-center gap-3">
              {onSkipToSummary && (
                <Button 
                  variant="outline" 
                  onClick={onSkipToSummary} 
                  disabled={actionInProgress} 
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Skip to Summary
                </Button>
              )}
              <Button 
                onClick={onComplete} 
                disabled={actionInProgress}
                className="bg-research-700 hover:bg-research-800 flex items-center gap-2"
              >
                {completeButtonText.includes("Continue") ? (
                  <>
                    {completeButtonText}
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {completeButtonText}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StepFlow;

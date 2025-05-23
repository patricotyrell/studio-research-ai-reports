
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

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
}

const StepFlow: React.FC<StepFlowProps> = ({
  title,
  description,
  children,
  onComplete,
  onCancel,
  showBackButton = false,
  onBack,
  actionInProgress = false,
  completeButtonText = "Apply Changes"
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={actionInProgress}>
              Cancel
            </Button>
          )}
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} disabled={actionInProgress} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <Button 
          onClick={onComplete} 
          disabled={actionInProgress}
          className="bg-research-700 hover:bg-research-800 flex items-center gap-1"
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
      </CardFooter>
    </Card>
  );
};

export default StepFlow;

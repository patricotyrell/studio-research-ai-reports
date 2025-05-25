
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, Wand2, Settings } from 'lucide-react';

interface AIGuidanceProps {
  title: string;
  description: string;
  automaticDescription: string;
  manualDescription: string;
  onAutomatic: () => void;
  onManual: () => void;
  actionInProgress?: boolean;
  icon?: React.ReactNode;
  onSkipToSummary?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const AIGuidance: React.FC<AIGuidanceProps> = ({
  title,
  description,
  automaticDescription,
  manualDescription,
  onAutomatic,
  onManual,
  actionInProgress = false,
  icon,
  onSkipToSummary,
  onBack,
  showBackButton = true
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Let AI Handle It</h3>
              </div>
              <p className="text-sm text-blue-800 mb-4">{automaticDescription}</p>
              <Button 
                onClick={onAutomatic}
                disabled={actionInProgress}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {actionInProgress ? 'Processing...' : 'Apply Automatically'}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Manual Review</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4">{manualDescription}</p>
              <Button 
                variant="outline" 
                onClick={onManual}
                disabled={actionInProgress}
                className="w-full"
              >
                Review Manually
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation buttons at bottom */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIGuidance;

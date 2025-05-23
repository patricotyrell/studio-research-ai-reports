
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Settings, SkipForward } from 'lucide-react';

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
  onSkipToSummary
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-start gap-4">
          {icon && <div className="mt-1">{icon}</div>}
          <div>
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </div>
        </div>
        {onSkipToSummary && (
          <Button 
            variant="outline" 
            onClick={onSkipToSummary}
            disabled={actionInProgress}
            className="flex items-center gap-1"
          >
            <SkipForward className="h-4 w-4" />
            Skip to Summary
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-blue-200 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI Recommended</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{automaticDescription}</p>
              <Button 
                onClick={onAutomatic}
                disabled={actionInProgress}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {actionInProgress ? 'Processing...' : 'Apply AI Recommendations'}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 bg-gray-50/30 hover:bg-gray-50/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Manual Review</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{manualDescription}</p>
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
      </CardContent>
    </Card>
  );
};

export default AIGuidance;

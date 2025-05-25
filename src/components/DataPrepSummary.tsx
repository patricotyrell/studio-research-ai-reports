
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataPrepSummaryProps {
  completedSteps: {
    missingValues: boolean;
    recodeVariables: boolean;
    compositeScores: boolean;
    standardizeVariables: boolean;
    removeColumns: boolean;
    fixDuplicates: boolean;
  };
  onContinue: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const DataPrepSummary: React.FC<DataPrepSummaryProps> = ({ 
  completedSteps, 
  onContinue, 
  onBack, 
  showBackButton = true 
}) => {
  const totalSteps = Object.keys(completedSteps).length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  
  const stepLabels = {
    missingValues: 'Handle Missing Values',
    recodeVariables: 'Recode Variables',
    compositeScores: 'Create Composite Scores',
    standardizeVariables: 'Standardize Variable Names',
    removeColumns: 'Remove Unused Columns',
    fixDuplicates: 'Fix Duplicates & Inconsistencies'
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-research-900 mb-2">Data Preparation Summary</h2>
            <p className="text-gray-600">
              Review the preparation steps completed on your dataset.
            </p>
          </div>
        </div>

        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Preparation Complete!</strong> You've completed {completedCount} of {totalSteps} available preparation steps.
            Your data is ready for visualization and analysis.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Completed Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(completedSteps).map(([step, completed]) => (
                <div key={step} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {completed ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={completed ? 'text-gray-900' : 'text-gray-500'}>
                      {stepLabels[step as keyof typeof stepLabels]}
                    </span>
                  </div>
                  <Badge 
                    className={
                      completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }
                  >
                    {completed ? 'Completed' : 'Skipped'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          {showBackButton && onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Previous Step
            </Button>
          )}
          <Button 
            onClick={onContinue}
            className="bg-research-700 hover:bg-research-800 flex items-center gap-1 ml-auto"
          >
            Continue to Visualization
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataPrepSummary;

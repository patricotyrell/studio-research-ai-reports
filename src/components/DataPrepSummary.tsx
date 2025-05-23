
import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import DataPreview from './DataPreview';

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
}

const DataPrepSummary: React.FC<DataPrepSummaryProps> = ({ completedSteps, onContinue }) => {
  // Count how many steps were completed
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = Object.keys(completedSteps).length;
  
  return (
    <div>
      <Alert className="mb-6 bg-green-50 border-green-200">
        <Check className="h-5 w-5 text-green-600" />
        <AlertTitle>Data Preparation Complete!</AlertTitle>
        <AlertDescription>
          {completedCount === totalSteps
            ? "You've completed all data preparation steps. Your data is now ready for analysis."
            : `You've completed ${completedCount} of ${totalSteps} preparation steps. You can always come back to complete more steps later.`}
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Preparation Steps Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.missingValues ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Handle Missing Values</span>
              </div>
              <Badge className={completedSteps.missingValues ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.missingValues ? "Completed" : "Skipped"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.recodeVariables ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Recode Variables</span>
              </div>
              <Badge className={completedSteps.recodeVariables ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.recodeVariables ? "Completed" : "Skipped"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.compositeScores ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Create Composite Scores</span>
              </div>
              <Badge className={completedSteps.compositeScores ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.compositeScores ? "Completed" : "Skipped"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.standardizeVariables ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Standardize Variable Names</span>
              </div>
              <Badge className={completedSteps.standardizeVariables ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.standardizeVariables ? "Completed" : "Skipped"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.removeColumns ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Remove Unused Columns</span>
              </div>
              <Badge className={completedSteps.removeColumns ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.removeColumns ? "Completed" : "Skipped"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border rounded-md p-3">
              <div className="flex items-center gap-2">
                {completedSteps.fixDuplicates ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span>Fix Duplicates & Inconsistencies</span>
              </div>
              <Badge className={completedSteps.fixDuplicates ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {completedSteps.fixDuplicates ? "Completed" : "Skipped"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-lg font-semibold mb-3">Final Prepared Dataset Preview</h3>
      <DataPreview maxRows={5} />
      
      <div className="flex justify-end mt-6">
        <Button 
          onClick={onContinue}
          className="bg-research-700 hover:bg-research-800"
        >
          Continue to Analysis
        </Button>
      </div>
    </div>
  );
};

export default DataPrepSummary;

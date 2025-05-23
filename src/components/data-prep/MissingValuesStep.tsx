import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables } from '@/utils/dataUtils';

interface MissingValuesStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack?: () => void;
}

interface VariableWithMissing {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  total: number;
  missingPercentage: number;
  missingHandling?: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore';
}

const MissingValuesStep: React.FC<MissingValuesStepProps> = ({ onComplete, onNext, onBack }) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [processingAutomatic, setProcessingAutomatic] = useState(false);
  const [completedAutomatic, setCompletedAutomatic] = useState(false);
  const [variables, setVariables] = useState<VariableWithMissing[]>([]);

  // Calculate variables with missing values
  useEffect(() => {
    const allVariables = getDatasetVariables();
    const varsWithMissing = allVariables
      .filter(v => v.missing && v.missing > 0)
      .map(v => ({
        name: v.name,
        type: v.type,
        missing: v.missing || 0,
        total: 150, // Assuming 150 is the total number of rows
        missingPercentage: ((v.missing || 0) / 150) * 100,
        missingHandling: v.missingHandling
      }));
    
    setVariables(varsWithMissing);
  }, []);

  const handleAutomaticCleanup = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Apply automatic rules to each variable
      const updatedVariables = variables.map(v => {
        let handling;
        
        // Simple rule-based approach
        if (v.missingPercentage > 50) {
          handling = 'drop';
        } else if (v.type === 'numeric') {
          handling = 'mean';
        } else if (v.type === 'categorical') {
          handling = 'mode';
        } else {
          handling = 'drop';
        }
        
        return { ...v, missingHandling: handling };
      });
      
      setVariables(updatedVariables);
      setProcessingAutomatic(false);
      setCompletedAutomatic(true);
    }, 1500);
  };

  const handleManualReview = () => {
    setShowGuidance(false);
    setShowManualOptions(true);
  };

  const handleMissingValueStrategy = (varName: string, strategy: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore') => {
    setVariables(variables.map(v => 
      v.name === varName ? { ...v, missingHandling: strategy } : v
    ));
  };

  const handleComplete = () => {
    onComplete(completedAutomatic);
    onNext();
  };

  if (variables.length === 0) {
    return (
      <Alert className="mb-6 bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle>No Missing Values</AlertTitle>
        <AlertDescription>
          Great news! Your dataset doesn't have any missing values. You can proceed to the next step.
        </AlertDescription>
      </Alert>
    );
  }

  if (showGuidance) {
    return (
      <AIGuidance
        title="Handle Missing Values"
        description={`We found ${variables.length} variables with missing data in your dataset. How would you like to handle them?`}
        automaticDescription="AI will analyze each variable and apply the most appropriate method (imputation, drop rows, etc.) based on data type and missing percentage."
        manualDescription="Review each variable and choose how to handle its missing values."
        onAutomatic={handleAutomaticCleanup}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
      />
    );
  }

  if (completedAutomatic) {
    return (
      <StepFlow
        title="Missing Values Handled"
        description="AI has automatically handled missing values based on best practices."
        onComplete={handleComplete}
        completeButtonText="Continue to Next Step"
      >
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            We've applied the following strategies to handle missing values:
          </AlertDescription>
        </Alert>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead>Applied Strategy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.name}>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell>
                  <Badge className={
                    variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                    variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                    variable.type === 'text' ? "bg-blue-100 text-blue-800" :
                    "bg-orange-100 text-orange-800"
                  }>
                    {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {variable.missing} ({Math.round(variable.missingPercentage)}%)
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800">
                    {variable.missingHandling === 'drop' ? 'Drop rows' : 
                     variable.missingHandling === 'mean' ? 'Replace with mean' :
                     variable.missingHandling === 'median' ? 'Replace with median' :
                     variable.missingHandling === 'mode' ? 'Replace with most frequent' :
                     variable.missingHandling === 'zero' ? 'Replace with zero' :
                     'Ignore'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StepFlow>
    );
  }

  if (showManualOptions) {
    return (
      <StepFlow
        title="Handle Missing Values"
        description="Select how to handle missing values for each variable."
        onComplete={handleComplete}
        onCancel={() => setShowGuidance(true)}
        completeButtonText="Apply & Continue"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead>Strategy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.name}>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell>
                  <Badge className={
                    variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                    variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                    variable.type === 'text' ? "bg-blue-100 text-blue-800" :
                    "bg-orange-100 text-orange-800"
                  }>
                    {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{variable.missing} ({Math.round(variable.missingPercentage)}%)</span>
                    <div className="w-24">
                      <Progress 
                        value={variable.missingPercentage} 
                        className={`h-2 ${variable.missingPercentage > 30 ? 'bg-amber-200' : 'bg-gray-200'}`}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={variable.missingHandling || 'ignore'} 
                    onValueChange={(value: any) => handleMissingValueStrategy(variable.name, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignore</SelectItem>
                      <SelectItem value="drop">Drop rows</SelectItem>
                      {variable.type === 'numeric' && (
                        <>
                          <SelectItem value="mean">Replace with mean</SelectItem>
                          <SelectItem value="median">Replace with median</SelectItem>
                          <SelectItem value="zero">Replace with zero</SelectItem>
                        </>
                      )}
                      {variable.type === 'categorical' && (
                        <SelectItem value="mode">Replace with most frequent</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Recommended Approaches</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• For numeric variables with few missing values: Replace with mean or median</li>
                <li>• For categorical variables: Replace with most frequent value</li>
                <li>• When more than 50% of values are missing: Consider dropping those rows</li>
              </ul>
            </div>
          </div>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default MissingValuesStep;

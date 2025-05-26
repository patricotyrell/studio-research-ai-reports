
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, AlertCircle, Info, Hash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables, applyDataPrepChanges } from '@/utils/dataUtils';

interface MissingValuesStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSkipToSummary: () => void;
  showBackButton?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

interface VariableWithMissing {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  total: number;
  missingPercentage: number;
  missingHandling?: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore';
  invalidValues?: string[];
  numericPercentage?: number;
  isMixedNumeric?: boolean;
  invalidValueHandling?: 'null' | 'zero' | 'mean' | 'ignore';
}

const MissingValuesStep: React.FC<MissingValuesStepProps> = ({ 
  onComplete, 
  onNext, 
  onBack, 
  onSkipToSummary, 
  showBackButton = true,
  currentStep,
  totalSteps
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [processingAutomatic, setProcessingAutomatic] = useState(false);
  const [completedAutomatic, setCompletedAutomatic] = useState(false);
  const [variables, setVariables] = useState<VariableWithMissing[]>([]);

  // Calculate variables with missing values or mixed numeric issues
  useEffect(() => {
    const allVariables = getDatasetVariables();
    const varsWithIssues = allVariables
      .filter(v => (v.missing && v.missing > 0) || (v.invalidValues && v.invalidValues.length > 0))
      .map(v => ({
        name: v.name,
        type: v.type,
        missing: v.missing || 0,
        total: 150, // Assuming 150 is the total number of rows
        missingPercentage: ((v.missing || 0) / 150) * 100,
        missingHandling: v.missingHandling,
        invalidValues: v.invalidValues,
        numericPercentage: v.numericPercentage,
        isMixedNumeric: v.type === 'numeric' && v.invalidValues && v.invalidValues.length > 0,
        invalidValueHandling: 'null' as const
      }));
    
    setVariables(varsWithIssues);
  }, []);

  const handleAutomaticCleanup = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Apply automatic rules to each variable
      const updatedVariables = variables.map(v => {
        let handling;
        let invalidHandling = 'null' as const;
        
        // Handle mixed numeric columns first
        if (v.isMixedNumeric) {
          handling = 'ignore'; // Don't drop rows for mixed numeric
          invalidHandling = 'null'; // Convert invalid values to null
        } else if (v.missingPercentage > 50) {
          handling = 'drop';
        } else if (v.type === 'numeric') {
          handling = 'mean';
        } else if (v.type === 'categorical') {
          handling = 'mode';
        } else {
          handling = 'drop';
        }
        
        return { 
          ...v, 
          missingHandling: handling,
          invalidValueHandling: invalidHandling
        };
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

  const handleInvalidValueStrategy = (varName: string, strategy: 'null' | 'zero' | 'mean' | 'ignore') => {
    setVariables(variables.map(v => 
      v.name === varName ? { ...v, invalidValueHandling: strategy } : v
    ));
  };

  const handleComplete = () => {
    // Apply the changes to the dataset
    const changes = {
      missingValueHandling: variables.reduce((acc, v) => {
        acc[v.name] = v.missingHandling;
        return acc;
      }, {} as Record<string, string>),
      invalidValueHandling: variables.reduce((acc, v) => {
        if (v.isMixedNumeric) {
          acc[v.name] = v.invalidValueHandling || 'null';
        }
        return acc;
      }, {} as Record<string, string>)
    };
    
    console.log('Applying missing values changes:', changes);
    applyDataPrepChanges('missingValues', changes);
    
    onComplete(completedAutomatic);
  };

  if (variables.length === 0) {
    return (
      <StepFlow
        title="Handle Missing Values"
        description="Missing values can bias your results. Choose how to handle variables with missing data."
        onComplete={handleComplete}
        onBack={showBackButton ? onBack : undefined}
        showBackButton={showBackButton}
        completeButtonText="Continue to Next Step"
        onSkipToSummary={onSkipToSummary}
        currentStep={currentStep}
        totalSteps={totalSteps}
      >
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>No Issues Found</AlertTitle>
          <AlertDescription>
            Great news! Your dataset doesn't have any missing values or mixed data type issues. You can proceed to the next step.
          </AlertDescription>
        </Alert>
      </StepFlow>
    );
  }

  if (showGuidance) {
    const mixedNumericCount = variables.filter(v => v.isMixedNumeric).length;
    const missingValueCount = variables.filter(v => v.missing > 0).length;
    
    let description = '';
    if (mixedNumericCount > 0 && missingValueCount > 0) {
      description = `We found ${missingValueCount} variables with missing data and ${mixedNumericCount} numeric columns with invalid values in your dataset.`;
    } else if (mixedNumericCount > 0) {
      description = `We found ${mixedNumericCount} numeric columns with invalid values that need to be handled.`;
    } else {
      description = `We found ${missingValueCount} variables with missing data in your dataset.`;
    }

    return (
      <AIGuidance
        title="Handle Missing Values & Data Issues"
        description={description}
        automaticDescription="AI will analyze each variable and apply the most appropriate method (imputation, drop rows, convert invalid values to null, etc.) based on data type and issue severity."
        manualDescription="Review each variable and choose how to handle its missing values and invalid entries."
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
        title="Missing Values & Data Issues Handled"
        description="AI has automatically handled missing values and data quality issues based on best practices."
        onComplete={handleComplete}
        onBack={showBackButton ? () => setShowGuidance(true) : undefined}
        showBackButton={showBackButton}
        completeButtonText="Continue to Next Step"
        onSkipToSummary={onSkipToSummary}
        currentStep={currentStep}
        totalSteps={totalSteps}
      >
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            We've applied the following strategies to handle missing values and data issues:
          </AlertDescription>
        </Alert>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Applied Strategy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.name}>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                      variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                      variable.type === 'text' ? "bg-blue-100 text-blue-800" :
                      "bg-orange-100 text-orange-800"
                    }>
                      {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                    </Badge>
                    {variable.isMixedNumeric && (
                      <Hash className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {variable.missing > 0 && (
                      <div className="text-sm">
                        {variable.missing} missing ({Math.round(variable.missingPercentage)}%)
                      </div>
                    )}
                    {variable.isMixedNumeric && (
                      <div className="text-sm text-purple-600">
                        {variable.invalidValues?.length} invalid values
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {variable.missing > 0 && (
                      <Badge className="bg-green-100 text-green-800 mr-1">
                        {variable.missingHandling === 'drop' ? 'Drop rows' : 
                         variable.missingHandling === 'mean' ? 'Replace with mean' :
                         variable.missingHandling === 'median' ? 'Replace with median' :
                         variable.missingHandling === 'mode' ? 'Replace with most frequent' :
                         variable.missingHandling === 'zero' ? 'Replace with zero' :
                         'Ignore'}
                      </Badge>
                    )}
                    {variable.isMixedNumeric && (
                      <Badge className="bg-purple-100 text-purple-800">
                        {variable.invalidValueHandling === 'null' ? 'Convert to null' :
                         variable.invalidValueHandling === 'zero' ? 'Convert to zero' :
                         variable.invalidValueHandling === 'mean' ? 'Convert to mean' :
                         'Leave as-is'}
                      </Badge>
                    )}
                  </div>
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
        title="Handle Missing Values & Data Issues"
        description="Missing values can bias your results. Choose how to handle variables with missing data."
        onComplete={handleComplete}
        onCancel={() => setShowGuidance(true)}
        onBack={showBackButton ? onBack : undefined}
        showBackButton={showBackButton}
        completeButtonText="Apply & Continue"
        onSkipToSummary={onSkipToSummary}
        currentStep={currentStep}
        totalSteps={totalSteps}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Missing Strategy</TableHead>
              <TableHead>Invalid Value Strategy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.name}>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                      variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                      variable.type === 'text' ? "bg-blue-100 text-blue-800" :
                      "bg-orange-100 text-orange-800"
                    }>
                      {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                    </Badge>
                    {variable.isMixedNumeric && (
                      <Hash className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {variable.missing > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{variable.missing} missing ({Math.round(variable.missingPercentage)}%)</span>
                        <div className="w-16">
                          <Progress 
                            value={variable.missingPercentage} 
                            className={`h-2 ${variable.missingPercentage > 30 ? 'bg-amber-200' : 'bg-gray-200'}`}
                          />
                        </div>
                      </div>
                    )}
                    {variable.isMixedNumeric && (
                      <div className="text-sm text-purple-600">
                        {variable.invalidValues?.length} invalid: {variable.invalidValues?.slice(0, 3).map(v => `"${v}"`).join(', ')}
                        {(variable.invalidValues?.length || 0) > 3 && '...'}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {variable.missing > 0 ? (
                    <Select 
                      value={variable.missingHandling || 'ignore'} 
                      onValueChange={(value: any) => handleMissingValueStrategy(variable.name, value)}
                    >
                      <SelectTrigger className="w-[140px]">
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
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {variable.isMixedNumeric ? (
                    <Select 
                      value={variable.invalidValueHandling || 'null'} 
                      onValueChange={(value: any) => handleInvalidValueStrategy(variable.name, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Convert to null ✓</SelectItem>
                        <SelectItem value="zero">Convert to zero</SelectItem>
                        <SelectItem value="mean">Convert to mean</SelectItem>
                        <SelectItem value="ignore">Leave as-is ⚠️</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
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
                <li>• <strong>Mixed numeric columns:</strong> Convert invalid values to null (recommended) to maintain numeric type</li>
                <li>• <strong>Missing values in numeric variables:</strong> Replace with mean or median</li>
                <li>• <strong>Missing values in categorical variables:</strong> Replace with most frequent value</li>
                <li>• <strong>High missing percentage ({">"}50%):</strong> Consider dropping those rows</li>
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

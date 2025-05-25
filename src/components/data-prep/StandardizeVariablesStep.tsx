import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Wand2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables } from '@/utils/dataUtils';

interface StandardizeVariablesStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  onSkipToSummary?: () => void;
}

interface VariableToStandardize {
  name: string;
  originalName: string;
  type: string;
  standardizedName: string;
  selected: boolean;
  needsStandardizing: boolean;
}

const StandardizeVariablesStep: React.FC<StandardizeVariablesStepProps> = ({ 
  onComplete, 
  onNext, 
  onBack, 
  showBackButton = true,
  onSkipToSummary 
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [processingAutomatic, setProcessingAutomatic] = useState(false);
  const [completedAutomatic, setCompletedAutomatic] = useState(false);
  const [variables, setVariables] = useState<VariableToStandardize[]>([]);

  // Analyze variables to find naming issues
  useEffect(() => {
    const allVariables = getDatasetVariables();
    
    const varsToStandardize = allVariables.map(v => {
      // Check if name needs standardizing
      const hasUnderscore = v.name.includes('_');
      const hasSpecialChars = /[^a-zA-Z0-9_]/.test(v.name);
      const isAllLowerCase = v.name === v.name.toLowerCase() && v.name.match(/[a-z]/) !== null;
      const isQ = v.name.match(/^q\d+/i) !== null;
      
      const needsStandardizing = hasUnderscore || hasSpecialChars || (isAllLowerCase && v.name.length > 3) || isQ;
      
      // Generate standardized name
      let standardizedName = v.name;
      
      if (isQ) {
        // Convert q1_satisfaction to Satisfaction (Q1)
        const match = v.name.match(/^q(\d+)_(.+)$/i);
        if (match) {
          const qNum = match[1];
          const label = match[2].replace(/_/g, ' ');
          standardizedName = label.charAt(0).toUpperCase() + label.slice(1) + ` (Q${qNum})`;
        }
      } else if (hasUnderscore) {
        // Convert snake_case to Title Case
        standardizedName = v.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else if (isAllLowerCase) {
        // Convert lowercase to Title Case
        standardizedName = v.name.charAt(0).toUpperCase() + v.name.slice(1);
      }
      
      // Remove special characters
      if (hasSpecialChars) {
        standardizedName = standardizedName.replace(/[^a-zA-Z0-9_\s()]/g, '');
      }
      
      return {
        name: v.name,
        originalName: v.name,
        type: v.type,
        standardizedName,
        selected: needsStandardizing,
        needsStandardizing
      };
    });
    
    setVariables(varsToStandardize);
  }, []);
  
  const handleAutomaticStandardization = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Apply standardization to names
      const updatedVariables = variables.map(v => ({
        ...v,
        name: v.needsStandardizing ? v.standardizedName : v.name,
        selected: v.needsStandardizing
      }));
      
      setVariables(updatedVariables);
      
      // Save the changes immediately for automatic standardization
      const standardizedNames = updatedVariables
        .filter(v => v.selected)
        .map(v => ({
          oldName: v.originalName,
          newName: v.standardizedName
        }));
      
      if (standardizedNames.length > 0) {
        console.log('Applying automatic standardization:', standardizedNames);
        // Import and use the utility function
        import('@/utils/dataUtils').then(({ applyDataPrepChanges }) => {
          applyDataPrepChanges('standardizeVariables', { standardizedNames });
        });
      }
      
      setProcessingAutomatic(false);
      setCompletedAutomatic(true);
    }, 1500);
  };

  const handleManualReview = () => {
    setShowGuidance(false);
    setShowManualOptions(true);
  };
  
  const handleStandardizedNameChange = (index: number, name: string) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      newVars[index] = {...newVars[index], standardizedName: name};
      return newVars;
    });
  };
  
  const handleVariableSelection = (index: number, selected: boolean) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      newVars[index] = {...newVars[index], selected};
      return newVars;
    });
  };
  
  const handleComplete = () => {
    // For manual completion, save the changes
    if (!completedAutomatic) {
      const standardizedNames = variables
        .filter(v => v.selected)
        .map(v => ({
          oldName: v.originalName,
          newName: v.standardizedName
        }));
      
      if (standardizedNames.length > 0) {
        console.log('Applying manual standardization:', standardizedNames);
        // Import and use the utility function
        import('@/utils/dataUtils').then(({ applyDataPrepChanges }) => {
          applyDataPrepChanges('standardizeVariables', { standardizedNames });
        });
      }
    }
    
    onComplete(completedAutomatic);
    onNext();
  };
  
  const needsStandardizingCount = variables.filter(v => v.needsStandardizing).length;

  if (showGuidance) {
    return (
      <AIGuidance
        title="Standardize Variable Names & Labels"
        description={
          needsStandardizingCount > 0
            ? `We found ${needsStandardizingCount} variable${needsStandardizingCount > 1 ? 's' : ''} with names that could be improved for clarity.`
            : "You can standardize variable names to make them more readable."
        }
        automaticDescription="AI will clean up variable names by removing special characters, converting to title case, and making them more readable."
        manualDescription="Review each variable name and customize how it should be displayed in analysis and reports."
        onAutomatic={handleAutomaticStandardization}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<Wand2 className="h-6 w-6 text-blue-600" />}
        onSkipToSummary={onSkipToSummary}
      />
    );
  }

  if (completedAutomatic) {
    const standardizedVariables = variables.filter(v => v.selected);
    
    return (
      <StepFlow
        title="Variable Names Standardized"
        description="AI has standardized your variable names for clarity."
        onComplete={() => {
          onComplete(true);
          onNext();
        }}
        onBack={showBackButton ? () => setShowGuidance(true) : undefined}
        showBackButton={showBackButton}
        completeButtonText="Continue to Next Step"
        onSkipToSummary={onSkipToSummary}
      >
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            {standardizedVariables.length > 0 
              ? `We've standardized ${standardizedVariables.length} variable name${standardizedVariables.length > 1 ? 's' : ''}.`
              : "No variables needed name standardization."}
          </AlertDescription>
        </Alert>
        
        {standardizedVariables.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Original Name</TableHead>
                <TableHead>Standardized Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standardizedVariables.map((variable) => (
                <TableRow key={variable.originalName}>
                  <TableCell className="font-mono text-sm">{variable.originalName}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-800 font-medium">
                      {variable.standardizedName}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StepFlow>
    );
  }

  if (showManualOptions) {
    return (
      <StepFlow
        title="Standardize Variable Names"
        description="Update variable names for clarity in analysis and reporting."
        onComplete={handleComplete}
        onBack={showBackButton ? () => setShowGuidance(true) : undefined}
        showBackButton={showBackButton}
        completeButtonText="Apply & Continue"
        onSkipToSummary={onSkipToSummary}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Standardize</TableHead>
              <TableHead>Original Name</TableHead>
              <TableHead>Standardized Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable, index) => (
              <TableRow key={variable.originalName} className={variable.needsStandardizing ? "bg-blue-50" : undefined}>
                <TableCell>
                  <Checkbox 
                    checked={variable.selected}
                    onCheckedChange={(checked) => handleVariableSelection(index, checked === true)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{variable.originalName}</TableCell>
                <TableCell>
                  <Input 
                    value={variable.standardizedName}
                    onChange={(e) => handleStandardizedNameChange(index, e.target.value)}
                    disabled={!variable.selected}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Standardization Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use clear, descriptive names (e.g., "Age" instead of "q1")</li>
                <li>• Use title case for readability (e.g., "Income Level" instead of "income_level")</li>
                <li>• Keep question numbers in parentheses if needed (e.g., "Satisfaction (Q5)")</li>
                <li>• Avoid special characters and underscores</li>
              </ul>
            </div>
          </div>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default StandardizeVariablesStep;

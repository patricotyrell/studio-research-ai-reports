import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Check, Trash, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables } from '@/utils/dataUtils';

interface RemoveColumnsStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  onSkipToSummary?: () => void;
}

interface VariableToRemove {
  name: string;
  type: string;
  missing: number;
  missingPercentage: number;
  unique: number;
  uniquePercentage: number;
  selected: boolean;
  removalReason?: string;
}

const RemoveColumnsStep: React.FC<RemoveColumnsStepProps> = ({ 
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
  const [variables, setVariables] = useState<VariableToRemove[]>([]);

  // Analyze variables to find candidates for removal
  useEffect(() => {
    const allVariables = getDatasetVariables();
    const totalRows = 150; // Assuming 150 rows
    
    const varsToConsider = allVariables.map(v => {
      const missing = v.missing || 0;
      const missingPercentage = (missing / totalRows) * 100;
      const unique = v.unique || 0;
      const uniquePercentage = (unique / totalRows) * 100;
      
      // Determine reason for potential removal
      let removalReason: string | undefined;
      let selected = false;
      
      if (missingPercentage > 50) {
        removalReason = "High missing data (>50%)";
        selected = true;
      } else if (uniquePercentage > 95 && v.type !== 'numeric') {
        removalReason = "Likely ID field or unique identifier";
        selected = true;
      } else if (uniquePercentage < 2 && v.type !== 'text') {
        removalReason = "Low variance (almost all values identical)";
        selected = true;
      }
      
      return {
        name: v.name,
        type: v.type,
        missing,
        missingPercentage,
        unique,
        uniquePercentage,
        selected: !!removalReason,
        removalReason
      };
    });
    
    setVariables(varsToConsider);
  }, []);
  
  const handleAutomaticRemoval = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Keep the automatic selections
      setProcessingAutomatic(false);
      setCompletedAutomatic(true);
    }, 1500);
  };

  const handleManualReview = () => {
    setShowGuidance(false);
    setShowManualOptions(true);
  };
  
  const handleVariableSelection = (index: number, selected: boolean) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      newVars[index] = {...newVars[index], selected};
      return newVars;
    });
  };
  
  const removalCandidates = variables.filter(v => v.removalReason);

  if (showGuidance) {
    return (
      <AIGuidance
        title="Remove Unused or Redundant Columns"
        description={
          removalCandidates.length > 0
            ? `We identified ${removalCandidates.length} variable${removalCandidates.length > 1 ? 's' : ''} that might be candidates for removal.`
            : "You can review and remove any variables you don't need for your analysis."
        }
        automaticDescription="AI will remove columns with significant missing data, unique identifiers, and columns with nearly identical values."
        manualDescription="Review each variable and decide which to keep or remove from your analysis."
        onAutomatic={handleAutomaticRemoval}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<Trash className="h-6 w-6 text-red-500" />}
        onSkipToSummary={onSkipToSummary}
      />
    );
  }

  if (completedAutomatic) {
    const removedVariables = variables.filter(v => v.selected);
    
    return (
      <StepFlow
        title="Columns Removed"
        description="AI has removed unnecessary columns from your analysis."
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
            {removedVariables.length > 0 
              ? `We've removed ${removedVariables.length} variable${removedVariables.length > 1 ? 's' : ''} from your analysis.`
              : "No variables were removed from your analysis."}
          </AlertDescription>
        </Alert>
        
        {removedVariables.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {removedVariables.map((variable) => (
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
                  <TableCell>{variable.removalReason || "User selected"}</TableCell>
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
        title="Remove Columns"
        description="Select variables to remove from your analysis."
        onComplete={() => {
          onComplete(false);
          onNext();
        }}
        onBack={showBackButton ? () => setShowGuidance(true) : undefined}
        showBackButton={showBackButton}
        completeButtonText="Apply & Continue"
        onSkipToSummary={onSkipToSummary}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Remove</TableHead>
              <TableHead>Variable</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead>Unique Values</TableHead>
              <TableHead>Suggestion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable, index) => (
              <TableRow key={variable.name} className={variable.removalReason ? "bg-red-50" : undefined}>
                <TableCell>
                  <Checkbox 
                    checked={variable.selected}
                    onCheckedChange={(checked) => handleVariableSelection(index, checked === true)}
                  />
                </TableCell>
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
                    <div className="w-16">
                      <Progress 
                        value={variable.missingPercentage} 
                        className={`h-2 ${variable.missingPercentage > 30 ? 'bg-amber-200' : 'bg-gray-200'}`}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{variable.unique} ({Math.round(variable.uniquePercentage)}%)</span>
                    <div className="w-16">
                      <Progress 
                        value={variable.uniquePercentage} 
                        className={`h-2 ${variable.uniquePercentage > 90 ? 'bg-amber-200' : 'bg-gray-200'}`}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {variable.removalReason ? (
                    <Badge className="bg-red-100 text-red-800">
                      Consider removing: {variable.removalReason}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      Keep for analysis
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">When to Remove Variables</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Variables with mostly missing data (&gt;50%)</li>
                <li>• Unique identifiers that aren't needed for analysis</li>
                <li>• Variables with almost no variance (all values identical)</li>
                <li>• Redundant variables that measure the same concept</li>
              </ul>
            </div>
          </div>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default RemoveColumnsStep;

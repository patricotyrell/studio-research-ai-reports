import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calculator, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables } from '@/utils/dataUtils';

interface CompositeScoresStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  onSkipToSummary?: () => void;
}

interface DetectedScale {
  name: string;
  variables: string[];
  method: 'mean' | 'sum';
  selected: boolean;
}

const CompositeScoresStep: React.FC<CompositeScoresStepProps> = ({ 
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
  const [detectedScales, setDetectedScales] = useState<DetectedScale[]>([]);

  // Analyze variables to detect potential scales/indexes
  useEffect(() => {
    const allVariables = getDatasetVariables();
    
    // Group variables by naming patterns to detect likely scales
    const patterns: {[key: string]: string[]} = {};
    
    allVariables
      .filter(v => v.type === 'numeric')
      .forEach(v => {
        // Look for common patterns like satisfaction_1, satisfaction_2, etc.
        const matches = v.name.match(/^([a-z]+)_?(\d+)$/i);
        if (matches) {
          const base = matches[1].toLowerCase();
          if (!patterns[base]) patterns[base] = [];
          patterns[base].push(v.name);
        }
        
        // Look for question patterns like q1_satisfaction, q2_satisfaction
        const qMatches = v.name.match(/^q(\d+)_([a-z]+)$/i);
        if (qMatches) {
          const base = qMatches[2].toLowerCase();
          if (!patterns[base]) patterns[base] = [];
          patterns[base].push(v.name);
        }
      });
    
    // Create detected scales from patterns
    const scales = Object.entries(patterns)
      .filter(([_, vars]) => vars.length >= 2) // Only consider groups with at least 2 items
      .map(([name, variables]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1) + "_Score", // Format name
        variables,
        method: 'mean' as 'mean' | 'sum', // Default to mean
        selected: variables.length >= 3 // Pre-select scales with 3+ items
      }));
    
    setDetectedScales(scales);
  }, []);
  
  const handleAutomaticComposites = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Keep only selected scales
      const updatedScales = detectedScales.map(scale => ({
        ...scale,
        selected: scale.variables.length >= 3 // Only auto-select scales with 3+ items
      }));
      
      setDetectedScales(updatedScales);
      setProcessingAutomatic(false);
      setCompletedAutomatic(true);
    }, 1500);
  };

  const handleManualReview = () => {
    setShowGuidance(false);
    setShowManualOptions(true);
  };
  
  const handleScaleSelection = (index: number, selected: boolean) => {
    setDetectedScales(prevScales => {
      const newScales = [...prevScales];
      newScales[index] = {...newScales[index], selected};
      return newScales;
    });
  };
  
  const handleScaleNameChange = (index: number, name: string) => {
    setDetectedScales(prevScales => {
      const newScales = [...prevScales];
      newScales[index] = {...newScales[index], name};
      return newScales;
    });
  };
  
  const handleMethodChange = (index: number, method: 'mean' | 'sum') => {
    setDetectedScales(prevScales => {
      const newScales = [...prevScales];
      newScales[index] = {...newScales[index], method};
      return newScales;
    });
  };
  
  const handleItemSelection = (scaleIndex: number, varName: string, selected: boolean) => {
    setDetectedScales(prevScales => {
      const newScales = [...prevScales];
      const scale = {...newScales[scaleIndex]};
      
      if (selected) {
        // Add item to variables if not already present
        if (!scale.variables.includes(varName)) {
          scale.variables = [...scale.variables, varName];
        }
      } else {
        // Remove item from variables
        scale.variables = scale.variables.filter(v => v !== varName);
      }
      
      newScales[scaleIndex] = scale;
      return newScales;
    });
  };
  
  const handleComplete = () => {
    onComplete(completedAutomatic);
    onNext();
  };
  
  // If there are no potential composite scores, show a message and allow skipping
  if (detectedScales.length === 0) {
    return (
      <StepFlow
        title="Create Composite Scores"
        description="No potential scales detected that could be combined into composite scores."
        onComplete={() => {
          onComplete(false);
          onNext();
        }}
        onBack={showBackButton ? onBack : undefined}
        showBackButton={showBackButton}
        completeButtonText="Continue to Next Step"
        onSkipToSummary={onSkipToSummary}
      >
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>No Potential Scales Detected</AlertTitle>
          <AlertDescription>
            We didn't find any related question groups that could be combined into composite scores.
          </AlertDescription>
        </Alert>
      </StepFlow>
    );
  }

  if (showGuidance) {
    return (
      <AIGuidance
        title="Create Composite Scores"
        description={`We detected ${detectedScales.length} potential question group${detectedScales.length > 1 ? 's' : ''} that could be combined into composite scores (e.g., satisfaction index from multiple questions).`}
        automaticDescription="AI will analyze related questions and create appropriate composite scores using best practices."
        manualDescription="Review each potential composite score and customize which items to include and how to calculate them."
        onAutomatic={handleAutomaticComposites}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<Calculator className="h-6 w-6 text-green-600" />}
        onSkipToSummary={onSkipToSummary}
      />
    );
  }

  if (completedAutomatic) {
    const selectedScales = detectedScales.filter(s => s.selected);
    
    return (
      <StepFlow
        title="Composite Scores Created"
        description="AI has created composite scores from related question groups."
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
            {selectedScales.length > 0 
              ? `We've created ${selectedScales.length} composite score${selectedScales.length > 1 ? 's' : ''}.`
              : "No composite scores were created."}
          </AlertDescription>
        </Alert>
        
        {selectedScales.length > 0 && (
          <div className="space-y-4">
            {selectedScales.map((scale) => (
              <Card key={scale.name} className="border-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium text-lg">{scale.name}</h3>
                      <Badge className="ml-2 bg-green-100 text-green-800">New variable</Badge>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {scale.method === 'mean' ? 'Average of items' : 'Sum of items'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Created from {scale.variables.length} items:
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {scale.variables.map((varName) => (
                      <Badge key={varName} variant="outline" className="bg-gray-50">
                        {varName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </StepFlow>
    );
  }

  if (showManualOptions) {
    return (
      <StepFlow
        title="Create Composite Scores"
        description="Create index variables by combining related questions into a single score."
        onComplete={() => {
          onComplete(false);
          onNext();
        }}
        onBack={showBackButton ? () => setShowGuidance(true) : undefined}
        showBackButton={showBackButton}
        completeButtonText="Apply & Continue"
        onSkipToSummary={onSkipToSummary}
      >
        <div className="space-y-8">
          {detectedScales.map((scale, scaleIndex) => (
            <div key={scale.name} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Checkbox 
                  id={`select-${scale.name}`} 
                  checked={scale.selected}
                  onCheckedChange={(checked) => handleScaleSelection(scaleIndex, checked === true)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={scale.name}
                      onChange={(e) => handleScaleNameChange(scaleIndex, e.target.value)}
                      className="w-64 font-medium"
                      disabled={!scale.selected}
                    />
                    <Badge className="bg-green-100 text-green-800">New variable</Badge>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Calculation Method</h4>
                <RadioGroup 
                  value={scale.method} 
                  onValueChange={(value) => handleMethodChange(scaleIndex, value as 'mean' | 'sum')}
                  disabled={!scale.selected}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mean" id={`mean-${scale.name}`} />
                    <Label htmlFor={`mean-${scale.name}`}>Mean (average)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sum" id={`sum-${scale.name}`} />
                    <Label htmlFor={`sum-${scale.name}`}>Sum (total)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <h4 className="font-medium mb-2">Items to Include</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Include</TableHead>
                    <TableHead>Variable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scale.variables.map((variable) => (
                    <TableRow key={variable}>
                      <TableCell className="w-14">
                        <Checkbox 
                          checked={true} 
                          onCheckedChange={(checked) => handleItemSelection(scaleIndex, variable, checked === true)}
                          disabled={!scale.selected}
                        />
                      </TableCell>
                      <TableCell>{variable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">About Composite Scores</h4>
              <p className="text-sm text-gray-600">
                Composite scores combine multiple related questions to create a more reliable measure. 
                Mean scores are easier to interpret on the original scale, while sum scores may be better 
                for counting-based measures.
              </p>
            </div>
          </div>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default CompositeScoresStep;

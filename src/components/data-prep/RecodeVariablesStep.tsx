import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Check, AlertTriangle, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetVariables } from '@/utils/dataUtils';

interface RecodeVariablesStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  onSkipToSummary?: () => void;
}

interface CategoricalVariable {
  name: string;
  type: string;
  categories: { [key: string]: number | null };
  selected: boolean;
  needsRecoding: boolean;
}

const RecodeVariablesStep: React.FC<RecodeVariablesStepProps> = ({ 
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
  const [variables, setVariables] = useState<CategoricalVariable[]>([]);

  // Get categorical variables from dataset
  useEffect(() => {
    const allVariables = getDatasetVariables();
    const categoricalVars = allVariables
      .filter(v => v.type === 'categorical')
      .map(v => {
        // Create empty coding if none exists
        const coding = v.coding || {};
        
        // Detect if recoding might be needed (inconsistent capitalization, etc.)
        const categoryNames = Object.keys(coding);
        const needsRecoding = categoryNames.some(c => 
          c !== c.trim() || 
          categoryNames.some(other => c !== other && c.toLowerCase() === other.toLowerCase())
        );
        
        return {
          name: v.name,
          type: v.type,
          categories: coding,
          selected: needsRecoding, // Pre-select variables that need recoding
          needsRecoding
        };
      });
    
    setVariables(categoricalVars);
  }, []);
  
  const handleAutomaticRecoding = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Apply automatic recoding rules
      const updatedVariables = variables.map(v => {
        const newCategories: {[key: string]: number} = {};
        
        // Get all category keys
        const categoryKeys = Object.keys(v.categories);
        
        // Apply recoding rules
        const processed = new Set();
        let counter = 0;
        
        categoryKeys.forEach(category => {
          const normalized = category.trim().toLowerCase();
          
          // Skip if we've already processed this normalized version
          if (processed.has(normalized)) return;
          
          // Get the "best" representation of this category
          const bestForm = categoryKeys
            .filter(c => c.trim().toLowerCase() === normalized)
            .sort((a, b) => {
              // Prefer proper case (first letter capital)
              const aProper = a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
              const bProper = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
              if (a === aProper && b !== bProper) return -1;
              if (b === bProper && a !== aProper) return 1;
              return a.length - b.length; // Shorter is better
            })[0];
          
          // Add the best form to our processed set
          processed.add(normalized);
          
          // Add to new categories with numerical value
          newCategories[bestForm] = counter++;
        });
        
        return {
          ...v,
          categories: newCategories,
          selected: v.needsRecoding // Only select variables that needed recoding
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
  
  const handleCategoryNameChange = (varIndex: number, oldCategoryName: string, newCategoryName: string) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      const variable = {...newVars[varIndex]};
      
      // Get the value associated with the old category name
      const value = variable.categories[oldCategoryName];
      
      // Create a new categories object without the old key
      const newCategories = {...variable.categories};
      delete newCategories[oldCategoryName];
      
      // Add the new key with the same value
      newCategories[newCategoryName] = value;
      
      // Update the variable
      variable.categories = newCategories;
      newVars[varIndex] = variable;
      
      return newVars;
    });
  };
  
  const handleCategoryValueChange = (varIndex: number, categoryName: string, value: string) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      const variable = {...newVars[varIndex]};
      
      // Parse the new value as a number
      const numValue = parseInt(value);
      
      // Update the value for this category
      variable.categories = {
        ...variable.categories,
        [categoryName]: isNaN(numValue) ? null : numValue
      };
      
      newVars[varIndex] = variable;
      
      return newVars;
    });
  };
  
  const handleVariableSelection = (varIndex: number, selected: boolean) => {
    setVariables(prevVars => {
      const newVars = [...prevVars];
      newVars[varIndex] = {...newVars[varIndex], selected};
      return newVars;
    });
  };
  
  const handleComplete = () => {
    onComplete(completedAutomatic);
    onNext();
  };
  
  const handleBackToGuidance = () => {
    setShowGuidance(true);
    setShowManualOptions(false);
    setCompletedAutomatic(false);
  };
  
  // If there are no categorical variables, show a message and allow skipping
  if (variables.length === 0) {
    return (
      <StepFlow
        title="Recode Variables"
        description="No categorical variables found that can be recoded in your dataset."
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
          <AlertTitle>No Categorical Variables Found</AlertTitle>
          <AlertDescription>
            We didn't find any categorical variables that can be recoded in your dataset.
          </AlertDescription>
        </Alert>
      </StepFlow>
    );
  }
  
  const needsRecodingCount = variables.filter(v => v.needsRecoding).length;

  if (showGuidance) {
    return (
      <AIGuidance
        title="Recode Variables"
        description={
          needsRecodingCount > 0
            ? `We found ${needsRecodingCount} variables that might benefit from recoding (e.g., standardizing text categories or fixing inconsistencies).`
            : "You can recode categorical variables for easier analysis or reporting."
        }
        automaticDescription="AI will standardize category names, fix inconsistencies (e.g., 'male' vs 'Male'), and assign numeric codes."
        manualDescription="Review each variable and customize how categories should be recoded."
        onAutomatic={handleAutomaticRecoding}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<AlertTriangle className="h-6 w-6 text-purple-500" />}
        onSkipToSummary={onSkipToSummary}
      />
    );
  }

  if (completedAutomatic) {
    const recodedVariables = variables.filter(v => v.selected);
    
    return (
      <StepFlow
        title="Variables Recoded"
        description="AI has automatically recoded categorical variables to standardize categories."
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
            {recodedVariables.length > 0 
              ? `We've standardized ${recodedVariables.length} variable${recodedVariables.length > 1 ? 's' : ''}.`
              : "No variables needed recoding."}
          </AlertDescription>
        </Alert>
        
        {recodedVariables.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Numeric Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recodedVariables.map((variable) => (
                Object.entries(variable.categories).map(([category, value], i) => (
                  <TableRow key={`${variable.name}-${category}`}>
                    {i === 0 ? (
                      <TableCell className="font-medium" rowSpan={Object.keys(variable.categories).length}>
                        {variable.name}
                      </TableCell>
                    ) : null}
                    <TableCell>{category}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))
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
        title="Recode Variables"
        description="Review and update category names and numeric codes for your categorical variables."
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
          {variables.map((variable, varIndex) => (
            <div key={variable.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`select-${variable.name}`} 
                    checked={variable.selected}
                    onCheckedChange={(checked) => handleVariableSelection(varIndex, checked === true)}
                  />
                  <label htmlFor={`select-${variable.name}`} className="font-medium text-lg">{variable.name}</label>
                  {variable.needsRecoding && (
                    <Badge className="bg-amber-100 text-amber-800">Needs recoding</Badge>
                  )}
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Original Category</TableHead>
                    <TableHead>Recoded Category</TableHead>
                    <TableHead>Numeric Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(variable.categories).map(([category, value], catIndex) => (
                    <TableRow key={`${variable.name}-${category}`}>
                      <TableCell>{category}</TableCell>
                      <TableCell>
                        <Input 
                          value={category} 
                          onChange={(e) => handleCategoryNameChange(varIndex, category, e.target.value)}
                          disabled={!variable.selected}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={value !== null ? value : ''} 
                          onChange={(e) => handleCategoryValueChange(varIndex, category, e.target.value)}
                          className="w-24"
                          disabled={!variable.selected}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Button 
                variant="outline"
                size="sm" 
                className="mt-2"
                disabled={!variable.selected}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button 
            className="bg-research-700 hover:bg-research-800 flex items-center gap-1"
            onClick={handleComplete}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default RecodeVariablesStep;


import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AnalysisIntent = 'distribution' | 'relationship' | 'comparison';

interface Variable {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

interface AnalysisVariableSelectorProps {
  analysisIntent: AnalysisIntent;
  firstVariable: string;
  secondVariable: string;
  variables: Variable[];
  onFirstVariableChange: (value: string) => void;
  onSecondVariableChange: (value: string) => void;
}

const AnalysisVariableSelector: React.FC<AnalysisVariableSelectorProps> = ({
  analysisIntent,
  firstVariable,
  secondVariable,
  variables,
  onFirstVariableChange,
  onSecondVariableChange,
}) => {
  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'categorical': return 'Categorical';
      case 'numeric': return 'Numeric';
      case 'text': return 'Text';
      case 'date': return 'Date';
      default: return type;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'categorical': return 'bg-purple-100 text-purple-800';
      case 'numeric': return 'bg-green-100 text-green-800';
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFirstVariableLabel = () => {
    switch (analysisIntent) {
      case 'distribution': return 'Variable to analyze:';
      case 'relationship': return 'First variable:';
      case 'comparison': return 'Grouping variable:';
      default: return 'First variable:';
    }
  };

  const getSecondVariableLabel = () => {
    switch (analysisIntent) {
      case 'relationship': return 'Second variable:';
      case 'comparison': return 'Outcome variable:';
      default: return 'Second variable:';
    }
  };

  // Filter variables based on analysis intent
  const getAvailableVariables = (isSecondVariable = false) => {
    // Exclude text variables for statistical analysis
    const filteredVars = variables.filter(v => v.type !== 'text');
    
    if (analysisIntent === 'comparison' && isSecondVariable) {
      // For comparison outcome variables, prefer numeric
      return filteredVars;
    }
    
    return filteredVars;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="first-variable">{getFirstVariableLabel()}</Label>
        <Select 
          value={firstVariable} 
          onValueChange={onFirstVariableChange}
        >
          <SelectTrigger id="first-variable" className="bg-white">
            <SelectValue placeholder="Select variable" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {getAvailableVariables().map(variable => (
              <SelectItem key={variable.name} value={variable.name}>
                <div className="flex items-center gap-2">
                  {variable.name}
                  <Badge className={getCategoryColor(variable.type)}>
                    {getCategoryLabel(variable.type)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {analysisIntent !== 'distribution' && (
        <div className="space-y-2">
          <Label htmlFor="second-variable">{getSecondVariableLabel()}</Label>
          <Select 
            value={secondVariable} 
            onValueChange={onSecondVariableChange}
          >
            <SelectTrigger id="second-variable" className="bg-white">
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {getAvailableVariables(true).map(variable => (
                <SelectItem key={variable.name} value={variable.name}>
                  <div className="flex items-center gap-2">
                    {variable.name}
                    <Badge className={getCategoryColor(variable.type)}>
                      {getCategoryLabel(variable.type)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default AnalysisVariableSelector;

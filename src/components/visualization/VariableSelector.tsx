
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataVariable } from '@/services/sampleDataService';

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';

interface VariableSelectorProps {
  explorationMode: ExplorationMode;
  primaryVariable: string;
  secondaryVariable: string;
  variables: DataVariable[];
  onPrimaryVariableChange: (value: string) => void;
  onSecondaryVariableChange: (value: string) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  explorationMode,
  primaryVariable,
  secondaryVariable,
  variables,
  onPrimaryVariableChange,
  onSecondaryVariableChange,
}) => {
  // Create a unique key based on variables to force re-render when they change
  const variablesKey = variables.map(v => `${v.name}-${v.type}`).join('|');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="primary-variable">
          {explorationMode === 'distribution' ? 'Variable to analyze:' : 
           explorationMode === 'relationship' ? 'First variable:' : 
           'Grouping variable:'}
        </Label>
        <Select 
          value={primaryVariable} 
          onValueChange={onPrimaryVariableChange}
          key={`primary-${variablesKey}`}
        >
          <SelectTrigger id="primary-variable" className="bg-white">
            <SelectValue placeholder="Select variable" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {variables.map(variable => (
              <SelectItem key={`primary-${variable.name}`} value={variable.name}>
                {variable.name} ({variable.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {explorationMode !== 'distribution' && (
        <div className="space-y-2">
          <Label htmlFor="secondary-variable">
            {explorationMode === 'relationship' ? 'Second variable:' : 'Measure to compare:'}
          </Label>
          <Select 
            value={secondaryVariable} 
            onValueChange={onSecondaryVariableChange}
            key={`secondary-${variablesKey}`}
          >
            <SelectTrigger id="secondary-variable" className="bg-white">
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {variables.map(variable => (
                <SelectItem key={`secondary-${variable.name}`} value={variable.name}>
                  {variable.name} ({variable.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default VariableSelector;

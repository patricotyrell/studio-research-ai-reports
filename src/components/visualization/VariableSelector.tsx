
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
          key={`primary-${variables.length}-${JSON.stringify(variables.map(v => v.name))}`}
        >
          <SelectTrigger id="primary-variable">
            <SelectValue placeholder="Select variable" />
          </SelectTrigger>
          <SelectContent>
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
            key={`secondary-${variables.length}-${JSON.stringify(variables.map(v => v.name))}`}
          >
            <SelectTrigger id="secondary-variable">
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
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

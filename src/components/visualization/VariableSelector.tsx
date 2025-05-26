
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

interface VariableSelectorProps {
  variables: DataVariable[];
  selectedVariables: string[];
  onVariableSelect: (variables: string[]) => void;
  mode: 'guided' | 'custom';
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  variables,
  selectedVariables,
  onVariableSelect,
  mode,
}) => {
  // Create a unique key based on variables to force re-render when they change
  const variablesKey = variables.map(v => `${v.name}-${v.type}`).join('|');
  
  const handlePrimaryVariableChange = (value: string) => {
    const newSelection = [value, selectedVariables[1]].filter(Boolean);
    onVariableSelect(newSelection);
  };

  const handleSecondaryVariableChange = (value: string) => {
    const newSelection = [selectedVariables[0], value].filter(Boolean);
    onVariableSelect(newSelection);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Variables</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary-variable">Primary Variable</Label>
          <Select 
            value={selectedVariables[0] || ''} 
            onValueChange={handlePrimaryVariableChange}
            key={`primary-${variablesKey}`}
          >
            <SelectTrigger id="primary-variable" className="bg-white">
              <SelectValue placeholder="Select primary variable" />
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
        
        <div className="space-y-2">
          <Label htmlFor="secondary-variable">Secondary Variable (Optional)</Label>
          <Select 
            value={selectedVariables[1] || ''} 
            onValueChange={handleSecondaryVariableChange}
            key={`secondary-${variablesKey}`}
          >
            <SelectTrigger id="secondary-variable" className="bg-white">
              <SelectValue placeholder="Select secondary variable" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="">None</SelectItem>
              {variables.map(variable => (
                <SelectItem key={`secondary-${variable.name}`} value={variable.name}>
                  {variable.name} ({variable.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default VariableSelector;

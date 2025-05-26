
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type ExplorationMode = 'guided' | 'custom';

interface ExplorationModeSelectorProps {
  mode: ExplorationMode;
  onModeChange: (mode: ExplorationMode) => void;
}

const ExplorationModeSelector: React.FC<ExplorationModeSelectorProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Exploration Mode</h3>
      <RadioGroup 
        value={mode} 
        onValueChange={(value) => onModeChange(value as ExplorationMode)}
        className="grid grid-cols-1 gap-3"
      >
        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
          <RadioGroupItem value="guided" id="guided" />
          <div className="flex-1">
            <Label htmlFor="guided" className="font-medium cursor-pointer">Guided Mode</Label>
            <p className="text-xs text-gray-500">AI-recommended visualizations based on your data</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
          <RadioGroupItem value="custom" id="custom" />
          <div className="flex-1">
            <Label htmlFor="custom" className="font-medium cursor-pointer">Custom Mode</Label>
            <p className="text-xs text-gray-500">Choose your own variables and chart types</p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ExplorationModeSelector;

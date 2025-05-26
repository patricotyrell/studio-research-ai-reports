
import React from 'react';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';

interface ExplorationModeSelectorProps {
  explorationMode: ExplorationMode;
  onExplorationModeChange: (mode: ExplorationMode) => void;
}

const ExplorationModeSelector: React.FC<ExplorationModeSelectorProps> = ({
  explorationMode,
  onExplorationModeChange,
}) => {
  return (
    <>
      <CardHeader>
        <CardTitle>What do you want to explore?</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={explorationMode} 
          onValueChange={(value) => onExplorationModeChange(value as ExplorationMode)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="distribution" id="distribution" />
            </div>
            <Label htmlFor="distribution" className="font-medium text-center mb-1">Distribution of one variable</Label>
            <p className="text-xs text-gray-500 text-center">Explore how values are distributed</p>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="relationship" id="relationship" />
            </div>
            <Label htmlFor="relationship" className="font-medium text-center mb-1">Relationship between two variables</Label>
            <p className="text-xs text-gray-500 text-center">Analyze correlations and patterns</p>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="comparison" id="comparison" />
            </div>
            <Label htmlFor="comparison" className="font-medium text-center mb-1">Comparison across groups</Label>
            <p className="text-xs text-gray-500 text-center">Compare measures across categories</p>
          </div>
        </RadioGroup>
      </CardContent>
    </>
  );
};

export default ExplorationModeSelector;

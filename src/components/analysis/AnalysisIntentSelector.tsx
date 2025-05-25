
import React from 'react';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type AnalysisIntent = 'distribution' | 'relationship' | 'comparison';

interface AnalysisIntentSelectorProps {
  analysisIntent: AnalysisIntent;
  onAnalysisIntentChange: (intent: AnalysisIntent) => void;
}

const AnalysisIntentSelector: React.FC<AnalysisIntentSelectorProps> = ({
  analysisIntent,
  onAnalysisIntentChange,
}) => {
  return (
    <>
      <CardHeader>
        <CardTitle>What do you want to analyze?</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={analysisIntent} 
          onValueChange={(value) => onAnalysisIntentChange(value as AnalysisIntent)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="distribution" id="distribution" />
            </div>
            <Label htmlFor="distribution" className="font-medium text-center mb-1">Distribution of one variable</Label>
            <p className="text-xs text-gray-500 text-center">Analyze patterns in a single variable</p>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="relationship" id="relationship" />
            </div>
            <Label htmlFor="relationship" className="font-medium text-center mb-1">Relationship between two variables</Label>
            <p className="text-xs text-gray-500 text-center">Test correlations and associations</p>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
            <div className="mb-2 flex items-center justify-center">
              <RadioGroupItem value="comparison" id="comparison" />
            </div>
            <Label htmlFor="comparison" className="font-medium text-center mb-1">Group comparisons across categories</Label>
            <p className="text-xs text-gray-500 text-center">Compare means or proportions between groups</p>
          </div>
        </RadioGroup>
      </CardContent>
    </>
  );
};

export default AnalysisIntentSelector;

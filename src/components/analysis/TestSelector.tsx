
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle } from 'lucide-react';

type AnalysisIntent = 'distribution' | 'relationship' | 'comparison';

interface Variable {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

interface TestSelectorProps {
  analysisIntent: AnalysisIntent;
  firstVariable: string;
  secondVariable: string;
  variables: Variable[];
  testSelectionMode: 'auto' | 'manual';
  selectedTest: string;
  onTestSelectionModeChange: (mode: 'auto' | 'manual') => void;
  onSelectedTestChange: (test: string) => void;
}

const TestSelector: React.FC<TestSelectorProps> = ({
  analysisIntent,
  firstVariable,
  secondVariable,
  variables,
  testSelectionMode,
  selectedTest,
  onTestSelectionModeChange,
  onSelectedTestChange,
}) => {
  const getRecommendedTests = () => {
    const firstVar = variables.find(v => v.name === firstVariable);
    const secondVar = variables.find(v => v.name === secondVariable);
    
    if (!firstVar) return [];
    
    if (analysisIntent === 'distribution') {
      if (firstVar.type === 'categorical') return ['frequency-test'];
      if (firstVar.type === 'numeric') return ['normality-test', 'descriptive-stats'];
    }
    
    if (analysisIntent === 'relationship' && secondVar) {
      if (firstVar.type === 'categorical' && secondVar.type === 'categorical') {
        return ['chi-square', 'fisher-exact'];
      }
      if (firstVar.type === 'numeric' && secondVar.type === 'numeric') {
        return ['pearson-correlation', 'spearman-correlation'];
      }
      if ((firstVar.type === 'categorical' && secondVar.type === 'numeric') ||
          (firstVar.type === 'numeric' && secondVar.type === 'categorical')) {
        return ['t-test', 'mann-whitney'];
      }
    }
    
    if (analysisIntent === 'comparison' && secondVar) {
      if (firstVar.type === 'categorical' && secondVar.type === 'numeric') {
        if (firstVar.unique <= 2) return ['t-test', 'mann-whitney'];
        else return ['anova', 'kruskal-wallis'];
      }
      if (firstVar.type === 'categorical' && secondVar.type === 'categorical') {
        return ['chi-square', 'fisher-exact'];
      }
    }
    
    return [];
  };

  const getTestDisplayName = (test: string) => {
    const testNames: Record<string, string> = {
      'frequency-test': 'Frequency Analysis',
      'normality-test': 'Normality Test',
      'descriptive-stats': 'Descriptive Statistics',
      'chi-square': 'Chi-square Test',
      'fisher-exact': 'Fisher\'s Exact Test',
      'pearson-correlation': 'Pearson Correlation',
      'spearman-correlation': 'Spearman Correlation',
      't-test': 'Independent T-test',
      'mann-whitney': 'Mann-Whitney U Test',
      'anova': 'One-way ANOVA',
      'kruskal-wallis': 'Kruskal-Wallis Test',
    };
    return testNames[test] || test;
  };

  const recommendedTests = getRecommendedTests();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Test Selection</Label>
        <RadioGroup 
          value={testSelectionMode} 
          onValueChange={(value) => onTestSelectionModeChange(value as 'auto' | 'manual')}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="auto" />
            <Label htmlFor="auto" className="cursor-pointer">Auto-detect test (recommended)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="cursor-pointer">Manual test selection</Label>
          </div>
        </RadioGroup>
      </div>

      {testSelectionMode === 'auto' && recommendedTests.length > 0 && (
        <div className="space-y-2">
          <Label>Recommended tests:</Label>
          <div className="space-y-2">
            {recommendedTests.map(test => (
              <div 
                key={test} 
                className="flex items-center p-2 border rounded-md bg-gray-50"
              >
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span>{getTestDisplayName(test)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {testSelectionMode === 'manual' && (
        <div className="space-y-2">
          <Label htmlFor="manual-test">Select Test</Label>
          <Select value={selectedTest} onValueChange={onSelectedTestChange}>
            <SelectTrigger id="manual-test" className="bg-white">
              <SelectValue placeholder="Choose a statistical test" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {recommendedTests.map(test => (
                <SelectItem key={test} value={test}>
                  {getTestDisplayName(test)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default TestSelector;

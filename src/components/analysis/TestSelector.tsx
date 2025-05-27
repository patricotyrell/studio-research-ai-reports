
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
import { CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      if (firstVar.type === 'categorical') {
        return ['frequency-test', 'goodness-of-fit'];
      }
      if (firstVar.type === 'numeric') {
        return ['normality-test', 'descriptive-stats', 'one-sample-t-test'];
      }
      if (firstVar.type === 'date') {
        return ['descriptive-stats', 'time-series-analysis'];
      }
    }
    
    if (analysisIntent === 'relationship' && secondVar) {
      // Categorical + Categorical
      if (firstVar.type === 'categorical' && secondVar.type === 'categorical') {
        const expectedTests = ['chi-square', 'fisher-exact'];
        // Add Cramér's V for effect size
        if (firstVar.unique > 2 || secondVar.unique > 2) {
          expectedTests.push('cramers-v');
        }
        return expectedTests;
      }
      
      // Numeric + Numeric
      if (firstVar.type === 'numeric' && secondVar.type === 'numeric') {
        return ['pearson-correlation', 'spearman-correlation', 'linear-regression'];
      }
      
      // Categorical + Numeric or Numeric + Categorical
      if ((firstVar.type === 'categorical' && secondVar.type === 'numeric') ||
          (firstVar.type === 'numeric' && secondVar.type === 'categorical')) {
        const categoricalVar = firstVar.type === 'categorical' ? firstVar : secondVar;
        if (categoricalVar.unique <= 2) {
          return ['point-biserial-correlation', 'mann-whitney'];
        } else {
          return ['eta-squared', 'kruskal-wallis'];
        }
      }
      
      // Date combinations
      if (firstVar.type === 'date' || secondVar.type === 'date') {
        return ['time-series-correlation', 'trend-analysis'];
      }
    }
    
    if (analysisIntent === 'comparison' && secondVar) {
      // Categorical grouping variable + Numeric outcome
      if (firstVar.type === 'categorical' && secondVar.type === 'numeric') {
        if (firstVar.unique === 2) {
          return ['independent-t-test', 'mann-whitney', 'welch-t-test'];
        } else if (firstVar.unique > 2) {
          return ['one-way-anova', 'kruskal-wallis', 'post-hoc-tukey'];
        }
      }
      
      // Numeric grouping variable + Numeric outcome (median split or regression)
      if (firstVar.type === 'numeric' && secondVar.type === 'numeric') {
        return ['linear-regression', 'polynomial-regression', 'correlation-analysis'];
      }
      
      // Categorical + Categorical (comparing proportions)
      if (firstVar.type === 'categorical' && secondVar.type === 'categorical') {
        return ['chi-square', 'fisher-exact', 'mcnemar-test'];
      }
      
      // Date grouping (before/after, time periods)
      if (firstVar.type === 'date' && secondVar.type === 'numeric') {
        return ['paired-t-test', 'time-series-analysis', 'trend-test'];
      }
    }
    
    return [];
  };

  const getTestDisplayName = (test: string) => {
    const testNames: Record<string, string> = {
      // Distribution tests
      'frequency-test': 'Frequency Analysis',
      'goodness-of-fit': 'Goodness of Fit Test',
      'normality-test': 'Normality Test (Shapiro-Wilk)',
      'descriptive-stats': 'Descriptive Statistics',
      'one-sample-t-test': 'One-Sample T-test',
      'time-series-analysis': 'Time Series Analysis',
      
      // Relationship tests
      'chi-square': 'Chi-square Test of Independence',
      'fisher-exact': 'Fisher\'s Exact Test',
      'cramers-v': 'Cramér\'s V (Effect Size)',
      'pearson-correlation': 'Pearson Correlation',
      'spearman-correlation': 'Spearman Rank Correlation',
      'linear-regression': 'Linear Regression',
      'point-biserial-correlation': 'Point-Biserial Correlation',
      'eta-squared': 'Eta-squared (Effect Size)',
      'time-series-correlation': 'Time Series Correlation',
      'trend-analysis': 'Trend Analysis',
      
      // Comparison tests
      'independent-t-test': 'Independent Samples T-test',
      'mann-whitney': 'Mann-Whitney U Test',
      'welch-t-test': 'Welch\'s T-test (Unequal Variances)',
      'one-way-anova': 'One-way ANOVA',
      'kruskal-wallis': 'Kruskal-Wallis Test',
      'post-hoc-tukey': 'Post-hoc Tukey HSD',
      'polynomial-regression': 'Polynomial Regression',
      'correlation-analysis': 'Correlation Analysis',
      'mcnemar-test': 'McNemar\'s Test',
      'paired-t-test': 'Paired T-test',
      'trend-test': 'Trend Test',
    };
    return testNames[test] || test;
  };

  const getTestDescription = (test: string) => {
    const descriptions: Record<string, string> = {
      'chi-square': 'Tests if two categorical variables are independent',
      'fisher-exact': 'Exact test for small sample sizes with categorical data',
      'pearson-correlation': 'Measures linear relationship between numeric variables',
      'spearman-correlation': 'Measures monotonic relationship (non-parametric)',
      'independent-t-test': 'Compares means between two independent groups',
      'one-way-anova': 'Compares means across multiple groups',
      'mann-whitney': 'Non-parametric test comparing two groups',
      'kruskal-wallis': 'Non-parametric test comparing multiple groups',
      'linear-regression': 'Models linear relationship and predicts outcomes',
      'normality-test': 'Tests if data follows normal distribution',
      'frequency-test': 'Analyzes distribution of categorical responses',
    };
    return descriptions[test] || '';
  };

  const recommendedTests = getRecommendedTests();
  const primaryRecommendation = recommendedTests[0];

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
        <div className="space-y-3">
          <Label>Recommended tests:</Label>
          
          {/* Primary recommendation with highlight */}
          {primaryRecommendation && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-900">
                      Primary recommendation: {getTestDisplayName(primaryRecommendation)}
                    </span>
                    {getTestDescription(primaryRecommendation) && (
                      <p className="text-sm text-blue-700 mt-1">
                        {getTestDescription(primaryRecommendation)}
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* All recommendations */}
          <div className="space-y-2">
            {recommendedTests.map(test => (
              <div 
                key={test} 
                className={`flex items-start p-3 border rounded-md ${
                  test === primaryRecommendation ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <CheckCircle className={`h-4 w-4 mr-3 mt-0.5 ${
                  test === primaryRecommendation ? 'text-blue-600' : 'text-green-600'
                }`} />
                <div className="flex-1">
                  <span className="font-medium">{getTestDisplayName(test)}</span>
                  {getTestDescription(test) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {getTestDescription(test)}
                    </p>
                  )}
                </div>
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
                  <div className="py-1">
                    <div className="font-medium">{getTestDisplayName(test)}</div>
                    {getTestDescription(test) && (
                      <div className="text-sm text-gray-600">
                        {getTestDescription(test)}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {recommendedTests.length === 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            No statistical tests are recommended for this variable combination. 
            Please select different variables or check your analysis intent.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TestSelector;

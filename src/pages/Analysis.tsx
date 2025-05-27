
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';
import AnalysisIntentSelector from '@/components/analysis/AnalysisIntentSelector';
import AnalysisVariableSelector from '@/components/analysis/AnalysisVariableSelector';
import TestSelector from '@/components/analysis/TestSelector';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import { getDatasetVariables } from '@/utils/dataUtils';

type AnalysisIntent = 'distribution' | 'relationship' | 'comparison';

interface Variable {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

interface AnalysisResult {
  type: string;
  description: string;
  pValue: number;
  significant: boolean;
  statistic: number;
  degreesOfFreedom?: number;
  effectSize?: number;
  interpretation: string;
  testSummary: {
    statistic: number;
    pValue: number;
    degreesOfFreedom?: number;
    effectSize?: number;
    confidenceInterval?: [number, number];
  };
}

const Analysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [analysisIntent, setAnalysisIntent] = useState<AnalysisIntent>('distribution');
  const [firstVariable, setFirstVariable] = useState<string>('');
  const [secondVariable, setSecondVariable] = useState<string>('');
  const [testSelectionMode, setTestSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  useEffect(() => {
    // Check if user is logged in and has current file
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }

    const currentFile = localStorage.getItem('currentFile');
    if (!currentFile) {
      navigate('/upload');
      return;
    }

    loadVariables();
  }, [navigate]);

  const loadVariables = () => {
    try {
      // Get variables from the current dataset (prepared or original)
      const datasetVariables = getDatasetVariables();
      if (datasetVariables && datasetVariables.length > 0) {
        setVariables(datasetVariables);
        
        // Set initial suggestions based on available variables
        const categoricalVar = datasetVariables.find(v => v.type === 'categorical');
        const numericVar = datasetVariables.find(v => v.type === 'numeric');
        
        if (categoricalVar) {
          setFirstVariable(categoricalVar.name);
        }
        
        if (numericVar) {
          setSecondVariable(numericVar.name);
        }
        
        return;
      }
    } catch (error) {
      console.log('Error loading dataset variables:', error);
    }

    // Fallback to sample variables if no dataset is available
    const syntheticVariables: Variable[] = [
      { name: 'age', type: 'numeric', missing: 0, unique: 45, example: '32' },
      { name: 'gender', type: 'categorical', missing: 0, unique: 3, example: 'Female' },
      { name: 'education', type: 'categorical', missing: 0, unique: 5, example: "Bachelor's degree" },
      { name: 'satisfaction', type: 'numeric', missing: 0, unique: 10, example: '4' },
      { name: 'likelihood_to_recommend', type: 'numeric', missing: 0, unique: 10, example: '8' },
      { name: 'product_category', type: 'categorical', missing: 0, unique: 6, example: 'Electronics' },
      { name: 'price_paid', type: 'numeric', missing: 0, unique: 98, example: '299.99' }
    ];
    
    setVariables(syntheticVariables);
    
    // Set initial suggestions
    if (syntheticVariables.find(v => v.name === 'gender')) {
      setFirstVariable('gender');
    }
    
    if (syntheticVariables.find(v => v.name === 'satisfaction')) {
      setSecondVariable('satisfaction');
    }
  };

  const runAnalysis = () => {
    if (!firstVariable || (analysisIntent !== 'distribution' && !secondVariable)) {
      toast({
        title: "Variables required",
        description: "Please select the required variables for analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const firstVar = variables.find(v => v.name === firstVariable);
      const secondVar = variables.find(v => v.name === secondVariable);
      
      let mockResult: AnalysisResult;
      
      if (analysisIntent === 'distribution') {
        if (firstVar?.type === 'categorical') {
          mockResult = {
            type: 'Frequency Analysis',
            description: `Frequency distribution analysis of ${firstVariable}`,
            pValue: 0.0,
            significant: true,
            statistic: 0,
            interpretation: `The frequency analysis of ${firstVariable} shows the distribution of categories. The most common category represents the modal value in your dataset.`,
            testSummary: {
              statistic: 0,
              pValue: 0.0,
            }
          };
        } else {
          mockResult = {
            type: 'Normality Test (Shapiro-Wilk)',
            description: `Testing normality of ${firstVariable} distribution`,
            pValue: 0.034,
            significant: true,
            statistic: 0.94,
            interpretation: `The Shapiro-Wilk test indicates that ${firstVariable} does not follow a normal distribution (W = 0.94, p = 0.034). Consider using non-parametric tests for further analysis.`,
            testSummary: {
              statistic: 0.94,
              pValue: 0.034,
            }
          };
        }
      } else if (analysisIntent === 'comparison' && firstVar?.type === 'categorical' && secondVar?.type === 'numeric') {
        if (firstVar.unique <= 2) {
          mockResult = {
            type: 'Independent Samples T-test',
            description: `Comparing ${secondVariable} across ${firstVariable} groups`,
            pValue: 0.023,
            significant: true,
            statistic: 2.34,
            degreesOfFreedom: 98,
            effectSize: 0.47,
            interpretation: `There is a statistically significant difference in ${secondVariable} between ${firstVariable} groups (t(98) = 2.34, p = 0.023, Cohen's d = 0.47). This represents a medium effect size, suggesting meaningful practical differences.`,
            testSummary: {
              statistic: 2.34,
              pValue: 0.023,
              degreesOfFreedom: 98,
              effectSize: 0.47,
              confidenceInterval: [0.12, 1.86]
            }
          };
        } else {
          mockResult = {
            type: 'One-way ANOVA',
            description: `Comparing ${secondVariable} across multiple ${firstVariable} groups`,
            pValue: 0.012,
            significant: true,
            statistic: 4.83,
            degreesOfFreedom: 2,
            effectSize: 0.23,
            interpretation: `There is a statistically significant difference in ${secondVariable} across ${firstVariable} groups (F(2,97) = 4.83, p = 0.012, η² = 0.23). Post-hoc tests are recommended to identify which specific groups differ.`,
            testSummary: {
              statistic: 4.83,
              pValue: 0.012,
              degreesOfFreedom: 2,
              effectSize: 0.23
            }
          };
        }
      } else if (analysisIntent === 'relationship' && firstVar?.type === 'numeric' && secondVar?.type === 'numeric') {
        mockResult = {
          type: 'Pearson Correlation',
          description: `Correlation analysis between ${firstVariable} and ${secondVariable}`,
          pValue: 0.002,
          significant: true,
          statistic: 0.56,
          degreesOfFreedom: 98,
          interpretation: `There is a moderately strong positive correlation between ${firstVariable} and ${secondVariable} (r(98) = 0.56, p = 0.002). This suggests that as ${firstVariable} increases, ${secondVariable} tends to increase as well.`,
          testSummary: {
            statistic: 0.56,
            pValue: 0.002,
            degreesOfFreedom: 98,
            confidenceInterval: [0.21, 0.78]
          }
        };
      } else {
        mockResult = {
          type: 'Chi-square Test of Independence',
          description: `Testing independence between ${firstVariable} and ${secondVariable}`,
          pValue: 0.047,
          significant: true,
          statistic: 9.65,
          degreesOfFreedom: 4,
          interpretation: `There is a statistically significant relationship between ${firstVariable} and ${secondVariable} (χ²(4) = 9.65, p = 0.047). These variables are not independent of each other.`,
          testSummary: {
            statistic: 9.65,
            pValue: 0.047,
            degreesOfFreedom: 4
          }
        };
      }
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis complete",
        description: "Your results are ready to review",
      });
    }, 1500);
  };

  const handleDownloadResults = () => {
    toast({
      title: "Download started",
      description: "Results are being prepared for download",
    });
  };

  const handleAddToReport = () => {
    if (analysisResult) {
      const reportItem = {
        id: `analysis-${Date.now()}`,
        type: 'analysis',
        title: `Statistical Analysis: ${analysisResult.type}`,
        content: analysisResult,
        caption: analysisResult.interpretation,
        addedAt: new Date().toISOString(),
        source: 'analysis'
      };
      
      // Save to both individual storage (for backward compatibility) and report items
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      
      // Load existing report items and add this one
      const existingItems = localStorage.getItem('reportItems');
      let reportItems = [];
      if (existingItems) {
        try {
          reportItems = JSON.parse(existingItems);
        } catch (e) {
          console.warn('Could not parse existing report items:', e);
        }
      }
      
      // Remove any previous analysis items and add the new one
      reportItems = reportItems.filter((item: any) => item.source !== 'analysis');
      reportItems.push(reportItem);
      
      localStorage.setItem('reportItems', JSON.stringify(reportItems));
      
      toast({
        title: "Added to report",
        description: "Analysis results have been added to your report",
      });
    }
  };

  const handleContinue = () => {
    navigate('/report');
  };

  const canRunAnalysis = () => {
    if (analysisIntent === 'distribution') {
      return firstVariable !== '';
    }
    return firstVariable !== '' && secondVariable !== '';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={5} 
          steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
        />
        
        <div className="max-w-4xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Analysis</h1>
              <p className="text-gray-600">
                Select variables and run appropriate statistical tests to analyze your data.
              </p>
            </div>
          </div>

          {/* Step 1: Analysis Intent */}
          <Card className="mb-6">
            <AnalysisIntentSelector
              analysisIntent={analysisIntent}
              onAnalysisIntentChange={(intent) => {
                setAnalysisIntent(intent);
                setFirstVariable('');
                setSecondVariable('');
                setAnalysisResult(null);
              }}
            />
          </Card>

          {/* Step 2: Variable Selection */}
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Variables</h3>
              <AnalysisVariableSelector
                analysisIntent={analysisIntent}
                firstVariable={firstVariable}
                secondVariable={secondVariable}
                variables={variables}
                onFirstVariableChange={setFirstVariable}
                onSecondVariableChange={setSecondVariable}
              />
            </div>
          </Card>

          {/* Step 3: Test Selection */}
          {canRunAnalysis() && (
            <Card className="mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Test Selection</h3>
                <TestSelector
                  analysisIntent={analysisIntent}
                  firstVariable={firstVariable}
                  secondVariable={secondVariable}
                  variables={variables}
                  testSelectionMode={testSelectionMode}
                  selectedTest={selectedTest}
                  onTestSelectionModeChange={setTestSelectionMode}
                  onSelectedTestChange={setSelectedTest}
                />
                
                <Button 
                  onClick={runAnalysis} 
                  className="w-full mt-6 bg-research-700 hover:bg-research-800"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Running Analysis...' : 'Run Analysis'}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Results */}
          {isAnalyzing && (
            <Card className="mb-6">
              <div className="p-6">
                <div className="py-10 text-center">
                  <p className="mb-4 text-muted-foreground">Running statistical analysis...</p>
                  <Progress value={65} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your data
                  </p>
                </div>
              </div>
            </Card>
          )}

          {analysisResult && (
            <div className="space-y-6">
              <AnalysisResults
                result={analysisResult}
                onDownloadResults={handleDownloadResults}
                onAddToReport={handleAddToReport}
              />
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleContinue} 
                  className="bg-research-700 hover:bg-research-800"
                >
                  Continue to Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analysis;

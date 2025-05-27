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
import { runStatisticalAnalysis, StatisticalTestResult } from '@/services/statisticalTestsService';

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
  const [analysisResult, setAnalysisResult] = useState<StatisticalTestResult | null>(null);
  
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

  const runAnalysis = async () => {
    if (!firstVariable || (analysisIntent !== 'distribution' && !secondVariable)) {
      toast({
        title: "Variables required",
        description: "Please select the required variables for analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Determine the test to run
      let testToRun = selectedTest;
      
      if (testSelectionMode === 'auto' || !testToRun) {
        // Auto-select based on variable types and intent
        const firstVar = variables.find(v => v.name === firstVariable);
        const secondVar = variables.find(v => v.name === secondVariable);
        
        if (analysisIntent === 'distribution') {
          if (firstVar?.type === 'categorical') {
            testToRun = 'frequency-test';
          } else if (firstVar?.type === 'numeric') {
            testToRun = 'normality-test';
          }
        } else if (analysisIntent === 'comparison' && firstVar && secondVar) {
          if (firstVar.type === 'categorical' && secondVar.type === 'numeric') {
            testToRun = firstVar.unique <= 2 ? 'independent-t-test' : 'one-way-anova';
          } else if (firstVar.type === 'numeric' && secondVar.type === 'categorical') {
            testToRun = secondVar.unique <= 2 ? 'independent-t-test' : 'one-way-anova';
          }
        } else if (analysisIntent === 'relationship' && firstVar && secondVar) {
          if (firstVar.type === 'numeric' && secondVar.type === 'numeric') {
            testToRun = 'pearson-correlation';
          } else if (firstVar.type === 'categorical' && secondVar.type === 'categorical') {
            testToRun = 'chi-square';
          }
        }
      }
      
      if (!testToRun) {
        throw new Error('Unable to determine appropriate statistical test');
      }
      
      console.log(`Running analysis: ${testToRun} with variables:`, {
        primary: firstVariable,
        secondary: secondVariable,
        intent: analysisIntent
      });
      
      // Run the actual statistical analysis
      const result = await runStatisticalAnalysis(
        analysisIntent,
        testToRun,
        firstVariable,
        secondVariable
      );
      
      setAnalysisResult(result);
      
      toast({
        title: "Analysis complete",
        description: "Your statistical analysis results are ready to review",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
              <h1 className="text-3xl font-bold text-research-900 mb-2">Statistical Analysis</h1>
              <p className="text-gray-600">
                Select variables and run statistical tests on your actual dataset to analyze relationships and patterns.
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
                <h3 className="text-lg font-semibold mb-4">Statistical Test Selection</h3>
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
                  {isAnalyzing ? 'Running Statistical Analysis...' : 'Run Analysis'}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Analysis Progress */}
          {isAnalyzing && (
            <Card className="mb-6">
              <div className="p-6">
                <div className="py-10 text-center">
                  <p className="mb-4 text-muted-foreground">Computing statistical analysis on your dataset...</p>
                  <Progress value={75} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Performing calculations and assumption checks
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Results */}
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

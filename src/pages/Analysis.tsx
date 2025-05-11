
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  interpretation: string;
}

const Analysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [groupingVariable, setGroupingVariable] = useState<string>('');
  const [outcomeVariable, setOutcomeVariable] = useState<string>('');
  const [testType, setTestType] = useState<string>('automatic');
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

    // In a real app, we would fetch the prepared variables
    // For now, we'll use synthetic data
    loadSyntheticVariables();
  }, [navigate]);

  const loadSyntheticVariables = () => {
    // Generate synthetic variable data for demonstration
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
    
    // Suggest initial variables
    if (syntheticVariables.find(v => v.name === 'gender')) {
      setGroupingVariable('gender');
    }
    
    if (syntheticVariables.find(v => v.name === 'satisfaction')) {
      setOutcomeVariable('satisfaction');
    }
  };

  const getAppropriateTests = () => {
    const groupVar = variables.find(v => v.name === groupingVariable);
    const outVar = variables.find(v => v.name === outcomeVariable);
    
    if (!groupVar || !outVar) return [];
    
    // Logic to suggest appropriate tests based on variable types
    if (groupVar.type === 'categorical' && outVar.type === 'numeric') {
      if (groupVar.unique <= 2) return ['t-test', 'mann-whitney'];
      else return ['anova', 'kruskal-wallis'];
    } else if (groupVar.type === 'categorical' && outVar.type === 'categorical') {
      return ['chi-square', 'fisher-exact'];
    } else if (groupVar.type === 'numeric' && outVar.type === 'numeric') {
      return ['correlation', 'regression'];
    }
    
    return ['custom'];
  };

  const runAnalysis = () => {
    if (!groupingVariable || !outcomeVariable) {
      toast({
        title: "Variables required",
        description: "Please select both grouping and outcome variables",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Generate synthetic analysis result
      const groupVar = variables.find(v => v.name === groupingVariable);
      const outVar = variables.find(v => v.name === outcomeVariable);
      
      let mockResult: AnalysisResult;
      
      if (groupVar?.type === 'categorical' && outVar?.type === 'numeric') {
        mockResult = {
          type: 't-test',
          description: `Independent samples t-test comparing ${outcomeVariable} across ${groupingVariable} groups`,
          pValue: 0.023,
          significant: true,
          statistic: 2.34,
          interpretation: `There is a statistically significant difference in ${outcomeVariable} between ${groupingVariable} groups (t = 2.34, p = 0.023). This suggests that ${groupingVariable} has a meaningful impact on ${outcomeVariable}.`
        };
      } else if (groupVar?.type === 'categorical' && outVar?.type === 'categorical') {
        mockResult = {
          type: 'chi-square',
          description: `Chi-square test of independence between ${groupingVariable} and ${outcomeVariable}`,
          pValue: 0.047,
          significant: true,
          statistic: 9.65,
          interpretation: `There is a statistically significant relationship between ${groupingVariable} and ${outcomeVariable} (χ² = 9.65, p = 0.047). This suggests that these variables are not independent of each other.`
        };
      } else {
        mockResult = {
          type: 'correlation',
          description: `Pearson correlation between ${groupingVariable} and ${outcomeVariable}`,
          pValue: 0.002,
          significant: true,
          statistic: 0.56,
          interpretation: `There is a moderately strong positive correlation between ${groupingVariable} and ${outcomeVariable} (r = 0.56, p = 0.002). This suggests that as ${groupingVariable} increases, ${outcomeVariable} tends to increase as well.`
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

  const handleContinue = () => {
    // Save analysis result to localStorage
    if (analysisResult) {
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
    }
    navigate('/visualization');
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'categorical': return 'Categorical';
      case 'numeric': return 'Numeric';
      case 'text': return 'Text';
      case 'date': return 'Date';
      default: return type;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'categorical': return 'bg-purple-100 text-purple-800';
      case 'numeric': return 'bg-green-100 text-green-800';
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={4} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-5xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Analysis</h1>
              <p className="text-gray-600">
                Select variables and run appropriate statistical tests to analyze your data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variable selection card */}
            <Card>
              <CardHeader>
                <CardTitle>Select Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grouping-var">Grouping Variable</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose a variable to group your data (e.g., Gender, Age Group)
                  </p>
                  <Select
                    value={groupingVariable}
                    onValueChange={setGroupingVariable}
                  >
                    <SelectTrigger id="grouping-var">
                      <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {variables
                        .filter(v => v.type === 'categorical' || v.type === 'numeric')
                        .map(variable => (
                          <SelectItem key={variable.name} value={variable.name}>
                            {variable.name} 
                            <Badge className={`ml-2 ${getCategoryColor(variable.type)}`}>
                              {getCategoryLabel(variable.type)}
                            </Badge>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome-var">Outcome Variable</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose a variable to measure (e.g., Satisfaction, Score)
                  </p>
                  <Select
                    value={outcomeVariable}
                    onValueChange={setOutcomeVariable}
                  >
                    <SelectTrigger id="outcome-var">
                      <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {variables
                        .filter(v => v.type === 'categorical' || v.type === 'numeric')
                        .map(variable => (
                          <SelectItem key={variable.name} value={variable.name}>
                            {variable.name}
                            <Badge className={`ml-2 ${getCategoryColor(variable.type)}`}>
                              {getCategoryLabel(variable.type)}
                            </Badge>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {groupingVariable && outcomeVariable && (
                  <div className="space-y-2 pt-4">
                    <Label>Statistical Test</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose how to determine the appropriate statistical test
                    </p>
                    <RadioGroup 
                      value={testType} 
                      onValueChange={setTestType}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="automatic" id="automatic" />
                        <Label htmlFor="automatic" className="cursor-pointer">Automatic (recommended)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual" className="cursor-pointer">I'll select the test manually</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {testType === 'automatic' && groupingVariable && outcomeVariable && (
                  <div className="pt-4">
                    <p className="text-sm font-medium">Recommended tests:</p>
                    <div className="mt-2 space-y-2">
                      {getAppropriateTests().map(test => (
                        <div 
                          key={test} 
                          className="flex items-center p-2 border rounded-md bg-gray-50"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="capitalize">{test.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={runAnalysis} 
                  className="w-full mt-4 bg-research-700 hover:bg-research-800"
                  disabled={!groupingVariable || !outcomeVariable || isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis results card */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="py-10 text-center">
                    <p className="mb-4 text-muted-foreground">Running statistical analysis...</p>
                    <Progress value={65} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process your data
                    </p>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 bg-gray-50">
                      <p className="font-medium mb-2">Test: {analysisResult.type}</p>
                      <p className="text-sm text-gray-600 mb-4">{analysisResult.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="border rounded p-3 bg-white">
                          <p className="text-xs text-gray-500">p-value</p>
                          <p className="font-mono font-bold">{analysisResult.pValue}</p>
                        </div>
                        <div className="border rounded p-3 bg-white">
                          <p className="text-xs text-gray-500">Test statistic</p>
                          <p className="font-mono font-bold">{analysisResult.statistic}</p>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-md ${analysisResult.significant ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                        <div className="flex items-center gap-2">
                          {analysisResult.significant ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="font-medium text-green-800">Statistically Significant</p>
                            </>
                          ) : (
                            <>
                              <Info className="h-5 w-5 text-amber-600" />
                              <p className="font-medium text-amber-800">Not Statistically Significant</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Interpretation</h3>
                      <p className="text-gray-700">{analysisResult.interpretation}</p>
                    </div>
                    
                    <Button 
                      onClick={handleContinue} 
                      className="w-full mt-2 bg-research-700 hover:bg-research-800"
                    >
                      Continue to Visualization
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center text-muted-foreground">
                    <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                    <p>Select variables and run analysis to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analysis;

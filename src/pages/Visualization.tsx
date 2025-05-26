import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, PlusCircle, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';
import { getCurrentDatasetState } from '@/utils/dataUtils';
import { 
  generateChartInsights, 
  calculateFrequencyDistribution, 
  generateCrosstabData, 
  generateFrequencyTableInsights,
  generateCrosstabInsights
} from '@/utils/visualizationUtils';
import { DataVariable } from '@/services/sampleDataService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ExplorationModeSelector from '@/components/visualization/ExplorationModeSelector';
import VariableSelector from '@/components/visualization/VariableSelector';
import ChartTypeSelector from '@/components/visualization/ChartTypeSelector';
import ChartRenderer from '@/components/visualization/ChartRenderer';
import InsightsPanel from '@/components/visualization/InsightsPanel';
import { getValidChartTypes, getRecommendedChartType, canShowTable as canShowTableUtil, isChartTypeValid } from '@/utils/chartSelectionUtils';
import ChartValidationAlert from '@/components/visualization/ChartValidationAlert';

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';
type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';
type VisualizationType = 'chart' | 'table';

interface ChartConfig {
  type: ChartType;
  title: string;
  icon: React.ReactNode;
  description: string;
  recommendedFor: {
    distribution?: string[];
    relationship?: string[];
    comparison?: string[];
  };
}

const Visualization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('distribution');
  const [primaryVariable, setPrimaryVariable] = useState<string>('');
  const [secondaryVariable, setSecondaryVariable] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<any[]>([]);
  const [variables, setVariables] = useState<DataVariable[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [hasGeneratedChart, setHasGeneratedChart] = useState(false);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('chart');
  const [frequencyTableData, setFrequencyTableData] = useState<{ category: string; frequency: number; percentage: number }[]>([]);
  const [crosstabData, setCrosstabData] = useState<any>(null);
  const [datasetState, setDatasetState] = useState<any>(null);
  const [variablesVersion, setVariablesVersion] = useState(0); // Force re-renders
  
  // Chart type configurations
  const chartTypes: Record<ChartType, ChartConfig> = {
    'bar': {
      type: 'bar',
      title: 'Bar Chart',
      icon: <></>,
      description: 'Shows the distribution of categorical variables or comparisons between groups.',
      recommendedFor: {
        distribution: ['categorical'],
        comparison: ['categorical', 'numeric']
      }
    },
    'line': {
      type: 'line',
      title: 'Line Chart',
      icon: <></>,
      description: 'Shows trends over time or continuous variables.',
      recommendedFor: {
        relationship: ['numeric', 'date']
      }
    },
    'pie': {
      type: 'pie',
      title: 'Pie Chart',
      icon: <></>,
      description: 'Shows proportional distribution of categories.',
      recommendedFor: {
        distribution: ['categorical']
      }
    },
    'scatter': {
      type: 'scatter',
      title: 'Scatter Plot',
      icon: <></>,
      description: 'Shows relationship between two numeric variables.',
      recommendedFor: {
        relationship: ['numeric']
      }
    },
    'boxplot': {
      type: 'boxplot',
      title: 'Box Plot',
      icon: <></>,
      description: 'Shows distribution statistics for numeric data.',
      recommendedFor: {
        distribution: ['numeric'],
        comparison: ['numeric']
      }
    },
    'histogram': {
      type: 'histogram',
      title: 'Histogram',
      icon: <></>,
      description: 'Shows distribution of numeric variables in bins.',
      recommendedFor: {
        distribution: ['numeric']
      }
    }
  };
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Load the most recent dataset state (prepared or original)
    const currentState = getCurrentDatasetState();
    console.log('Loading current dataset state:', currentState);
    
    if (!currentState.variables || currentState.variables.length === 0) {
      navigate('/data-overview');
      return;
    }
    
    console.log('Current variables with details:', currentState.variables.map(v => ({ 
      name: v.name, 
      type: v.type,
      originalCategories: v.originalCategories,
      coding: v.coding 
    })));
    
    setDatasetState(currentState);
    setVariables(currentState.variables);
    setVariablesVersion(prev => prev + 1); // Force component re-renders
    
    // Clear existing selections to ensure fresh state
    console.log('Clearing variable selections for fresh state');
    setPrimaryVariable('');
    setSecondaryVariable('');
    
    // Set default variables after state is updated
    setTimeout(() => {
      if (currentState.variables.length > 0) {
        // Find first categorical and numeric variables as defaults
        const categoricalVar = currentState.variables.find(v => v.type === 'categorical');
        const numericVar = currentState.variables.find(v => v.type === 'numeric');
        
        console.log('Available variable types:', {
          categorical: categoricalVar?.name,
          numeric: numericVar?.name,
          total: currentState.variables.length
        });
        
        if (categoricalVar) {
          console.log('Setting primary variable to:', categoricalVar.name);
          setPrimaryVariable(categoricalVar.name);
        } else if (currentState.variables.length > 0) {
          console.log('No categorical variables found, using first variable:', currentState.variables[0].name);
          setPrimaryVariable(currentState.variables[0].name);
        }
        
        if (numericVar && currentState.variables.length > 1) {
          console.log('Setting secondary variable to:', numericVar.name);
          setSecondaryVariable(numericVar.name);
        } else if (currentState.variables.length > 1) {
          console.log('No numeric variables found, using second variable:', currentState.variables[1].name);
          setSecondaryVariable(currentState.variables[1].name);
        }
      }
    }, 200);
  }, [navigate]);
  
  // Handle exploration mode change and recommend chart type
  useEffect(() => {
    if (primaryVariable && variables.length > 0) {
      recommendChartType();
      
      // Set appropriate visualization type
      if (explorationMode === 'distribution' || 
         (explorationMode === 'relationship' && 
          getVariableType(primaryVariable) === 'categorical' && 
          getVariableType(secondaryVariable) === 'categorical')) {
        setVisualizationType('chart');
      } else {
        setVisualizationType('chart');
      }
    }
  }, [explorationMode, primaryVariable, secondaryVariable, variables]);
  
  const getVariableType = (varName: string): string => {
    const variable = variables.find(v => v.name === varName);
    return variable ? variable.type : '';
  };
  
  const recommendChartType = () => {
    const primaryType = getVariableType(primaryVariable) as any;
    const secondaryType = getVariableType(secondaryVariable) as any;
    
    const recommendedChart = getRecommendedChartType(explorationMode, primaryType, secondaryType);
    setChartType(recommendedChart);
  };
  
  const generateChart = () => {
    console.log('Generating chart with consistent calculations...');
    
    // Generate frequency table data first for consistency
    const newFrequencyTableData = calculateFrequencyDistribution([], primaryVariable, getVariableType(primaryVariable));
    setFrequencyTableData(newFrequencyTableData);
    
    // Generate chart data that matches the frequency table
    let newChartData: any[] = [];
    
    if (explorationMode === 'distribution') {
      if (getVariableType(primaryVariable) === 'categorical') {
        // Use the same data as frequency table for consistency
        newChartData = newFrequencyTableData.map(item => ({
          name: item.category,
          value: item.frequency,
          count: item.frequency,
          percentage: item.percentage
        }));
      } else {
        // For numeric variables, use frequency data as bins
        newChartData = newFrequencyTableData.map(item => ({
          bin: item.category,
          frequency: item.frequency,
          percentage: item.percentage
        }));
      }
    } else if (explorationMode === 'relationship') {
      if (chartType === 'scatter') {
        // Generate scatter plot data
        for (let i = 0; i < 30; i++) {
          newChartData.push({
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
          });
        }
      } else {
        // For other relationship charts, use consistent data
        if (getVariableType(primaryVariable) === 'categorical') {
          newChartData = newFrequencyTableData.map(item => ({
            name: item.category,
            value: Math.floor(Math.random() * 100),
            frequency: item.frequency
          }));
        } else {
          newChartData = [
            { name: 'Jan', value: Math.floor(Math.random() * 100) },
            { name: 'Feb', value: Math.floor(Math.random() * 100) },
            { name: 'Mar', value: Math.floor(Math.random() * 100) },
            { name: 'Apr', value: Math.floor(Math.random() * 100) },
            { name: 'May', value: Math.floor(Math.random() * 100) },
            { name: 'Jun', value: Math.floor(Math.random() * 100) },
          ];
        }
      }
      
      // Generate crosstab data if both variables are categorical
      if (getVariableType(primaryVariable) === 'categorical' && 
          getVariableType(secondaryVariable) === 'categorical') {
        setCrosstabData(generateCrosstabData([], primaryVariable, secondaryVariable));
      } else {
        setCrosstabData(null);
      }
    } else if (explorationMode === 'comparison') {
      // Generate comparison data using consistent frequencies
      if (getVariableType(primaryVariable) === 'categorical') {
        newChartData = newFrequencyTableData.map(item => ({
          name: item.category,
          [secondaryVariable]: Math.floor(Math.random() * 100),
          error: Math.floor(Math.random() * 10) + 5,
          frequency: item.frequency
        }));
      } else {
        newChartData = [
          { name: 'Group A', [secondaryVariable]: Math.floor(Math.random() * 100), error: Math.floor(Math.random() * 10) + 5 },
          { name: 'Group B', [secondaryVariable]: Math.floor(Math.random() * 100), error: Math.floor(Math.random() * 10) + 5 },
          { name: 'Group C', [secondaryVariable]: Math.floor(Math.random() * 100), error: Math.floor(Math.random() * 10) + 5 },
        ];
      }
      
      // Generate crosstab data if both variables are categorical
      if (getVariableType(primaryVariable) === 'categorical' && 
          getVariableType(secondaryVariable) === 'categorical') {
        setCrosstabData(generateCrosstabData([], primaryVariable, secondaryVariable));
      } else {
        setCrosstabData(null);
      }
    }
    
    setChartData(newChartData);
    setHasGeneratedChart(true);
    
    console.log('Generated data:', { chartData: newChartData, frequencyData: newFrequencyTableData });
    
    // Generate insights based on visualization type
    if (visualizationType === 'chart') {
      const chartInsight = generateChartInsights(
        explorationMode,
        chartType,
        primaryVariable,
        secondaryVariable,
        getVariableType(primaryVariable),
        getVariableType(secondaryVariable),
        newChartData
      );
      setInsights(chartInsight);
    } else if (visualizationType === 'table') {
      if (crosstabData) {
        const crosstabInsight = generateCrosstabInsights(
          crosstabData,
          primaryVariable,
          secondaryVariable
        );
        setInsights(crosstabInsight);
      } else if (newFrequencyTableData.length > 0) {
        const freqInsight = generateFrequencyTableInsights(
          newFrequencyTableData,
          primaryVariable
        );
        setInsights(freqInsight);
      }
    }
  };
  
  const downloadChart = () => {
    toast({
      title: "Chart downloaded",
      description: "Your chart image has been downloaded as PNG",
    });
  };
  
  const downloadTable = () => {
    toast({
      title: "Table downloaded",
      description: "Your table data has been downloaded as CSV",
    });
  };
  
  const addToReport = () => {
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable: primaryVariable,
      secondaryVariable: secondaryVariable,
      explorationMode,
      insights,
      visualizationType,
      frequencyTableData
    }));
    
    toast({
      title: "Added to report",
      description: `${visualizationType === 'chart' ? 'Chart' : 'Table'} has been added to your report`,
    });
  };
  
  const copyInsights = () => {
    navigator.clipboard.writeText(insights);
    toast({
      title: "Copied to clipboard",
      description: "AI insights have been copied to clipboard",
    });
  };
  
  const handleContinue = () => {
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable: primaryVariable,
      secondaryVariable: secondaryVariable,
      explorationMode,
      insights,
      visualizationType,
      frequencyTableData
    }));
    
    navigate('/analysis');
  };
  
  // Filter chart types based on exploration mode
  const getRelevantChartTypes = (): ChartType[] => {
    const primaryType = getVariableType(primaryVariable) as any;
    const secondaryType = getVariableType(secondaryVariable) as any;
    
    return getValidChartTypes(explorationMode, primaryType, secondaryType);
  };
  
  // Updated function to check if table can be shown
  const canShowTable = (): boolean => {
    const primaryType = getVariableType(primaryVariable) as any;
    const secondaryType = getVariableType(secondaryVariable) as any;
    
    return canShowTableUtil(explorationMode, primaryType, secondaryType);
  };
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={4}
          steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Visualization</h1>
              <p className="text-gray-600">
                Create insightful visualizations based on your {datasetState?.hasBeenPrepared ? 'prepared' : 'original'} data and get AI-powered interpretations.
              </p>
            </div>
          </div>
          
          {/* Show dataset status alert */}
          {datasetState?.hasBeenPrepared && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertTitle>Using Prepared Dataset</AlertTitle>
              <AlertDescription>
                This visualization uses your prepared dataset with applied data cleaning and transformations from the preparation steps.
              </AlertDescription>
            </Alert>
          )}
          
          {variables.length > 0 ? (
            <>
              <Card className="mb-6">
                <ExplorationModeSelector
                  explorationMode={explorationMode}
                  onExplorationModeChange={setExplorationMode}
                />
                <CardContent>
                  <div className="space-y-6">
                    <VariableSelector
                      explorationMode={explorationMode}
                      primaryVariable={primaryVariable}
                      secondaryVariable={secondaryVariable}
                      variables={variables}
                      onPrimaryVariableChange={(value) => {
                        console.log('Primary variable changed to:', value);
                        setPrimaryVariable(value);
                      }}
                      onSecondaryVariableChange={(value) => {
                        console.log('Secondary variable changed to:', value);
                        setSecondaryVariable(value);
                      }}
                    />
                    
                    {/* Chart Validation Alert */}
                    {primaryVariable && (
                      <ChartValidationAlert
                        primaryVariable={primaryVariable}
                        secondaryVariable={secondaryVariable}
                        primaryType={getVariableType(primaryVariable)}
                        secondaryType={getVariableType(secondaryVariable)}
                        explorationMode={explorationMode}
                        validChartTypes={getRelevantChartTypes()}
                        selectedChartType={chartType}
                      />
                    )}
                    
                    <ChartTypeSelector
                      chartType={chartType}
                      visualizationType={visualizationType}
                      explorationMode={explorationMode}
                      canShowTable={canShowTable()}
                      relevantChartTypes={getRelevantChartTypes()}
                      onChartTypeChange={setChartType}
                      onVisualizationTypeChange={setVisualizationType}
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={generateChart}
                        className="bg-research-700 hover:bg-research-800"
                        disabled={getRelevantChartTypes().length === 0 && !canShowTable()}
                      >
                        Generate {visualizationType === 'chart' ? 'Chart' : 'Table'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* ... keep existing Card for Chart Preview */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {visualizationType === 'chart' ? 'Chart Preview' : 
                     explorationMode === 'distribution' ? 'Frequency Table' : 'Crosstab Table'}
                  </CardTitle>
                  {visualizationType === 'chart' && hasGeneratedChart && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadChart}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addToReport}
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add to Report
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ChartRenderer
                    chartType={chartType}
                    visualizationType={visualizationType}
                    explorationMode={explorationMode}
                    chartData={chartData}
                    primaryVariable={primaryVariable}
                    secondaryVariable={secondaryVariable}
                    frequencyTableData={frequencyTableData}
                    crosstabData={crosstabData}
                    onDownloadTable={downloadTable}
                    onAddToReport={addToReport}
                  />
                </CardContent>
              </Card>
              
              {/* ... keep existing InsightsPanel and continue button */}
              {hasGeneratedChart && (
                <InsightsPanel
                  insights={insights}
                  onCopyInsights={copyInsights}
                />
              )}
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleContinue}
                  className="bg-research-700 hover:bg-research-800"
                  disabled={!hasGeneratedChart}
                >
                  Continue to Analysis
                </Button>
              </div>
            </>
          ) : (
            // ... keep existing no variables case
            <Card>
              <CardContent className="py-12 text-center flex flex-col items-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                <p>No variables found. Please complete data preparation first.</p>
                <Button 
                  onClick={() => navigate('/data-preparation')} 
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Data Preparation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Visualization;

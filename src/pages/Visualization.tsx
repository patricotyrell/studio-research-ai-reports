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
    if (!currentState.variables || currentState.variables.length === 0) {
      navigate('/data-overview');
      return;
    }
    
    console.log('Loading dataset state:', currentState);
    console.log('Current variables:', currentState.variables.map(v => ({ name: v.name, type: v.type })));
    
    setDatasetState(currentState);
    setVariables(currentState.variables);
    
    // Always reset selections when loading new dataset state to avoid mismatched variable names
    console.log('Resetting variable selections due to dataset state change');
    setPrimaryVariable('');
    setSecondaryVariable('');
    
    // Set default variables after a brief delay to ensure state is updated
    setTimeout(() => {
      if (currentState.variables.length > 0) {
        // Find first categorical and numeric variables as defaults
        const categoricalVar = currentState.variables.find(v => v.type === 'categorical')?.name;
        const numericVar = currentState.variables.find(v => v.type === 'numeric')?.name;
        
        console.log('Setting default variables:', { categoricalVar, numericVar });
        
        if (categoricalVar) {
          setPrimaryVariable(categoricalVar);
        } else {
          setPrimaryVariable(currentState.variables[0].name);
        }
        
        if (numericVar && currentState.variables.length > 1) {
          setSecondaryVariable(numericVar);
        } else if (currentState.variables.length > 1) {
          setSecondaryVariable(currentState.variables[1].name);
        }
      }
    }, 100);
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
        // Show table option for categorical variables
        setVisualizationType('chart'); // Default to chart, user can toggle
      } else {
        // For other combinations, default to chart only
        setVisualizationType('chart');
      }
    }
  }, [explorationMode, primaryVariable, secondaryVariable]);
  
  const getVariableType = (varName: string): string => {
    const variable = variables.find(v => v.name === varName);
    return variable ? variable.type : '';
  };
  
  const recommendChartType = () => {
    const primaryType = getVariableType(primaryVariable);
    const secondaryType = getVariableType(secondaryVariable);
    
    let recommendedChart: ChartType = 'bar'; // Default
    
    if (explorationMode === 'distribution') {
      if (primaryType === 'numeric') {
        recommendedChart = 'histogram';
      } else if (primaryType === 'categorical') {
        recommendedChart = 'bar';
      }
    } else if (explorationMode === 'relationship') {
      if (primaryType === 'numeric' && secondaryType === 'numeric') {
        recommendedChart = 'scatter';
      } else if (primaryType === 'date' || secondaryType === 'date') {
        recommendedChart = 'line';
      } else {
        recommendedChart = 'bar';
      }
    } else if (explorationMode === 'comparison') {
      if (primaryType === 'categorical' && secondaryType === 'numeric') {
        recommendedChart = 'bar';
      } else if (primaryType === 'categorical' && secondaryType === 'categorical') {
        recommendedChart = 'bar';
      } else if (primaryType === 'numeric' && secondaryType === 'categorical') {
        recommendedChart = 'bar';
      }
    }
    
    setChartType(recommendedChart);
  };
  
  const generateChart = () => {
    // Generate synthetic data based on selected variables and chart type
    let newChartData: any[] = [];
    
    if (explorationMode === 'distribution') {
      if (primaryVariable && getVariableType(primaryVariable) === 'categorical') {
        // Get actual categories from the dataset
        const primaryVar = variables.find(v => v.name === primaryVariable);
        const actualCategories = primaryVar?.originalCategories || 
                                (primaryVar?.coding ? Object.keys(primaryVar.coding) : []);
        
        // Generate categorical distribution data using actual categories
        newChartData = actualCategories.slice(0, 6).map(category => ({
          name: category,
          value: Math.floor(Math.random() * 40) + 10,
          count: Math.floor(Math.random() * 50) + 20
        }));
        
        // Also generate frequency table data with actual categories
        setFrequencyTableData(calculateFrequencyDistribution([], primaryVariable, 'categorical'));
      } else {
        // Generate numeric distribution data (histogram)
        newChartData = [
          { bin: '0-10', frequency: Math.floor(Math.random() * 20) + 5 },
          { bin: '11-20', frequency: Math.floor(Math.random() * 30) + 10 },
          { bin: '21-30', frequency: Math.floor(Math.random() * 40) + 15 },
          { bin: '31-40', frequency: Math.floor(Math.random() * 30) + 10 },
          { bin: '41-50', frequency: Math.floor(Math.random() * 20) + 5 },
          { bin: '51+', frequency: Math.floor(Math.random() * 10) + 2 },
        ];
        
        // Generate binned frequency data for numeric variables
        setFrequencyTableData(calculateFrequencyDistribution([], primaryVariable, 'numeric'));
      }
    } else if (explorationMode === 'relationship') {
      // Generate relationship data
      if (chartType === 'scatter') {
        for (let i = 0; i < 30; i++) {
          newChartData.push({
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
          });
        }
      } else {
        // For line charts or bar charts in relationship mode
        if (getVariableType(primaryVariable) === 'categorical') {
          // Use actual categories for the primary variable
          const primaryVar = variables.find(v => v.name === primaryVariable);
          const actualCategories = primaryVar?.originalCategories || 
                                  (primaryVar?.coding ? Object.keys(primaryVar.coding) : []);
          
          newChartData = actualCategories.slice(0, 6).map(category => ({
            name: category,
            value: Math.floor(Math.random() * 100)
          }));
        } else {
          // Default to month names for non-categorical relationships
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
      // Generate comparison data using actual categories
      if (getVariableType(primaryVariable) === 'categorical') {
        const primaryVar = variables.find(v => v.name === primaryVariable);
        const actualCategories = primaryVar?.originalCategories || 
                                (primaryVar?.coding ? Object.keys(primaryVar.coding) : []);
        
        newChartData = actualCategories.slice(0, 4).map(category => ({
          name: category,
          [secondaryVariable]: Math.floor(Math.random() * 100),
          error: Math.floor(Math.random() * 10) + 5
        }));
      } else {
        // Fallback to generic groups if primary variable isn't categorical
        newChartData = [
          { 
            name: 'Group A', 
            [secondaryVariable]: Math.floor(Math.random() * 100),
            error: Math.floor(Math.random() * 10) + 5
          },
          { 
            name: 'Group B', 
            [secondaryVariable]: Math.floor(Math.random() * 100),
            error: Math.floor(Math.random() * 10) + 5
          },
          { 
            name: 'Group C', 
            [secondaryVariable]: Math.floor(Math.random() * 100),
            error: Math.floor(Math.random() * 10) + 5
          },
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
        // Generate insights for crosstab
        const crosstabInsight = generateCrosstabInsights(
          crosstabData,
          primaryVariable,
          secondaryVariable
        );
        setInsights(crosstabInsight);
      } else if (frequencyTableData.length > 0) {
        // Generate insights for frequency table
        const freqInsight = generateFrequencyTableInsights(
          frequencyTableData,
          primaryVariable
        );
        setInsights(freqInsight);
      }
    }
  };
  
  const downloadChart = () => {
    // In a real implementation, we'd use a library like html2canvas
    // to capture the chart as an image and download it
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
    // Save chart data and settings to localStorage for report generation
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable: primaryVariable,
      secondaryVariable: secondaryVariable,
      explorationMode,
      insights,
      visualizationType
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
    // Make sure we save the chart data before navigating
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable: primaryVariable,
      secondaryVariable: secondaryVariable,
      explorationMode,
      insights,
      visualizationType
    }));
    
    navigate('/analysis');
  };
  
  // Filter chart types based on exploration mode
  const getRelevantChartTypes = (): ChartType[] => {
    const relevantTypes: ChartType[] = [];
    
    Object.entries(chartTypes).forEach(([type, config]) => {
      const chartType = type as ChartType;
      const primaryType = getVariableType(primaryVariable);
      const secondaryType = getVariableType(secondaryVariable);
      
      if (explorationMode === 'distribution' && config.recommendedFor.distribution?.includes(primaryType)) {
        relevantTypes.push(chartType);
      } else if (explorationMode === 'relationship' && 
                config.recommendedFor.relationship?.includes(primaryType) && 
                config.recommendedFor.relationship?.includes(secondaryType)) {
        relevantTypes.push(chartType);
      } else if (explorationMode === 'comparison' && config.recommendedFor.comparison?.includes(primaryType)) {
        relevantTypes.push(chartType);
      }
    });
    
    // If no relevant charts found, include default options
    if (relevantTypes.length === 0) {
      return ['bar', 'line', 'pie'];
    }
    
    return relevantTypes;
  };
  
  const canShowTable = (): boolean => {
    if (explorationMode === 'distribution') {
      return true; // Can always show frequency tables for single variables
    } else if (explorationMode === 'relationship' || explorationMode === 'comparison') {
      // Can show crosstabs when both variables are categorical
      return getVariableType(primaryVariable) === 'categorical' && 
             getVariableType(secondaryVariable) === 'categorical';
    }
    return false;
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
                      >
                        Generate {visualizationType === 'chart' ? 'Chart' : 'Table'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
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

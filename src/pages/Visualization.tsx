
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StepIndicator from '@/components/StepIndicator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ExplorationModeSelector from '@/components/visualization/ExplorationModeSelector';
import VariableSelector from '@/components/visualization/VariableSelector';
import ChartTypeSelector from '@/components/visualization/ChartTypeSelector';
import ChartRenderer from '@/components/visualization/ChartRenderer';
import ChartValidationAlert from '@/components/visualization/ChartValidationAlert';
import InsightsPanel from '@/components/visualization/InsightsPanel';
import { getDatasetForAnalysis } from '@/utils/dataUtils';
import { useNavigate } from 'react-router-dom';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

const Visualization = () => {
  const navigate = useNavigate();
  const [explorationMode, setExplorationMode] = useState<'guided' | 'custom'>('guided');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isValidConfiguration, setIsValidConfiguration] = useState(false);
  const [dataset, setDataset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎨 VISUALIZATION - Loading data');
    
    try {
      const analysisDataset = getDatasetForAnalysis();
      console.log('📊 Dataset loaded:', {
        variables: analysisDataset.variables?.length || 0,
        rows: analysisDataset.rows?.length || 0,
        isRealData: analysisDataset.isRealData
      });
      
      setDataset(analysisDataset);
    } catch (error) {
      console.error('❌ Error loading dataset:', error);
    }
    
    setLoading(false);
  }, []);

  const handleVariableSelect = (variables: string[]) => {
    console.log('📊 Variables selected:', variables);
    setSelectedVariables(variables);
  };

  const handleChartTypeSelect = (type: string) => {
    console.log('📊 Chart type selected:', type);
    setChartType(type as ChartType);
  };

  const handleValidationChange = (isValid: boolean) => {
    setIsValidConfiguration(isValid);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-research-700"></div>
            <span className="ml-4">Loading visualization module...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dataset || !dataset.variables || dataset.variables.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-yellow-800">No data available for visualization</p>
                <p className="text-yellow-700">
                  Sample data has been loaded for demonstration. Upload your own data to create real visualizations.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => navigate('/upload')} size="sm">
                    Upload Data
                  </Button>
                  <Button onClick={() => navigate('/sample-data')} size="sm" variant="outline">
                    Try Sample Data
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={4} 
          steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
        />
        
        <div className="max-w-7xl mx-auto mt-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-research-900 mb-2">Data Visualization</h1>
            <p className="text-gray-600">
              Create insightful visualizations to explore patterns and relationships in your data.
            </p>
            <div className="text-xs text-gray-400 mt-2 font-mono">
              📊 Dataset: {dataset.rows.length} rows, {dataset.variables.length} variables
              | {dataset.isRealData ? "Real Data" : "Sample Data"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visualization Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ExplorationModeSelector
                    mode={explorationMode}
                    onModeChange={setExplorationMode}
                  />
                  
                  <VariableSelector
                    variables={dataset.variables}
                    selectedVariables={selectedVariables}
                    onVariableSelect={handleVariableSelect}
                    mode={explorationMode}
                  />
                  
                  <ChartTypeSelector
                    selectedVariables={selectedVariables}
                    variables={dataset.variables}
                    onChartTypeSelect={handleChartTypeSelect}
                    mode={explorationMode}
                  />
                  
                  <ChartValidationAlert
                    selectedVariables={selectedVariables}
                    chartType={chartType}
                    variables={dataset.variables}
                    onValidationChange={handleValidationChange}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Visualization Panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartRenderer
                    data={dataset.rows}
                    variables={dataset.variables}
                    selectedVariables={selectedVariables}
                    chartType={chartType}
                    isValid={isValidConfiguration}
                  />
                </CardContent>
              </Card>

              {isValidConfiguration && (
                <InsightsPanel
                  data={dataset.rows}
                  variables={dataset.variables}
                  selectedVariables={selectedVariables}
                  chartType={chartType}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Visualization;

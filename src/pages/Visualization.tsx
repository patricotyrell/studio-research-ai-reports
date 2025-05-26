
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
import { getDatasetForAnalysis, getCurrentDatasetState } from '@/utils/dataUtils';
import { getDatasetInfo, getAllDatasetRows, getDatasetVariables } from '@/utils/datasetCache';
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
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎨 VISUALIZATION MODULE - Starting enhanced data load process');
    
    // Enhanced data loading with multiple fallbacks
    try {
      // Step 1: Try to get analysis dataset
      const analysisDataset = getDatasetForAnalysis();
      console.log('🎯 Analysis dataset retrieved:', {
        variables: analysisDataset.variables?.length || 0,
        rows: analysisDataset.rows?.length || 0,
        isRealData: analysisDataset.isRealData,
        sessionId: analysisDataset.sessionId
      });

      // Step 2: Validate the dataset
      const hasValidData = analysisDataset.variables && 
                          analysisDataset.variables.length > 0 && 
                          analysisDataset.rows && 
                          analysisDataset.rows.length > 0;

      if (hasValidData) {
        console.log('✅ Valid dataset found for visualization');
        setDataset(analysisDataset);
        setDataLoadError(null);
      } else {
        console.error('🚨 Invalid dataset structure');
        setDataLoadError('Dataset structure is invalid or empty');
      }

    } catch (error) {
      console.error('🚨 Error loading dataset for visualization:', error);
      setDataLoadError(`Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  }, []);

  const handleVariableSelect = (variables: string[]) => {
    console.log('📊 Variables selected for visualization:', variables);
    setSelectedVariables(variables);
  };

  const handleChartTypeSelect = (type: string) => {
    console.log('📊 Chart type selected:', type);
    setChartType(type as ChartType);
  };

  const handleValidationChange = (isValid: boolean) => {
    setIsValidConfiguration(isValid);
  };

  const handleReturnToUpload = () => {
    navigate('/upload');
  };

  const handleReturnToOverview = () => {
    navigate('/data-overview');
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

  // Enhanced error handling
  if (dataLoadError || !dataset) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-red-800">Unable to load data for visualization</p>
                <p className="text-red-700">
                  {dataLoadError || 'No dataset found. Please ensure you have uploaded and prepared your data.'}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleReturnToUpload} size="sm" variant="outline">
                    Return to Upload
                  </Button>
                  <Button onClick={handleReturnToOverview} size="sm" variant="outline">
                    Return to Overview
                  </Button>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">Debug Information</summary>
                  <div className="mt-1 text-xs text-red-500 font-mono space-y-1">
                    <div>Variables: {dataset?.variables?.length || 0}</div>
                    <div>Rows: {dataset?.rows?.length || 0}</div>
                    <div>Real data: {dataset?.isRealData ? 'Yes' : 'No'}</div>
                    <div>Session ID: {dataset?.sessionId || 'None'}</div>
                    <div>Error: {dataLoadError || 'No specific error'}</div>
                  </div>
                </details>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const hasValidData = dataset.variables && 
                      dataset.variables.length > 0 && 
                      dataset.rows && 
                      dataset.rows.length > 0;

  if (!hasValidData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Dataset validation failed. Please check your data and try again.
              <div className="mt-2 text-xs text-gray-500 font-mono">
                <div>Variables available: {dataset?.variables?.length || 0}</div>
                <div>Rows available: {dataset?.rows?.length || 0}</div>
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
              {dataset.sessionId && ` | Session: ${dataset.sessionId.slice(-8)}`}
              | {dataset.isRealData ? "Real Data" : "Sample Data"}
              {dataset.prepChanges && Object.keys(dataset.prepChanges).length > 0 && 
                ` | Prep steps: ${Object.keys(dataset.prepChanges).length}`}
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


import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StepIndicator from '@/components/StepIndicator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import ExplorationModeSelector from '@/components/visualization/ExplorationModeSelector';
import VariableSelector from '@/components/visualization/VariableSelector';
import ChartTypeSelector from '@/components/visualization/ChartTypeSelector';
import ChartRenderer from '@/components/visualization/ChartRenderer';
import ChartValidationAlert from '@/components/visualization/ChartValidationAlert';
import InsightsPanel from '@/components/visualization/InsightsPanel';
import { getDatasetForAnalysis, getCurrentDatasetState } from '@/utils/dataUtils';
import { getDatasetInfo } from '@/utils/datasetCache';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

const Visualization = () => {
  const [explorationMode, setExplorationMode] = useState<'guided' | 'custom'>('guided');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isValidConfiguration, setIsValidConfiguration] = useState(false);
  const [dataset, setDataset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: Log transition to visualization module
    console.log('🎨 VISUALIZATION MODULE - Loading dataset');
    
    const datasetInfo = getDatasetInfo();
    console.log('📊 Visualization - Dataset info on mount:', datasetInfo);
    
    const currentState = getCurrentDatasetState();
    console.log('📊 Visualization - Current dataset state:', currentState);
    
    // Get analysis dataset (only real/modified data)
    const analysisDataset = getDatasetForAnalysis();
    console.log('📊 Visualization - Dataset for analysis:', {
      variables: analysisDataset.variables.length,
      rows: analysisDataset.rows.length,
      sessionId: analysisDataset.sessionId,
      isRealData: analysisDataset.isRealData,
      prepChanges: Object.keys(analysisDataset.prepChanges)
    });
    
    // Verify dataset integrity - only proceed with real data
    if (analysisDataset.rows.length === 0) {
      console.error('🚨 CRITICAL: No rows found in visualization dataset!');
    } else if (analysisDataset.rows.length < 1000 && datasetInfo.originalRows > 50000) {
      console.error('🚨 CRITICAL: Dataset size mismatch in visualization:', {
        currentRows: analysisDataset.rows.length,
        originalRows: datasetInfo.originalRows
      });
    } else {
      console.log('✅ Dataset integrity check passed:', {
        rowsAvailable: analysisDataset.rows.length,
        variablesAvailable: analysisDataset.variables.length
      });
    }
    
    setDataset(analysisDataset);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-research-700"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dataset || !dataset.variables || dataset.variables.length === 0 || !dataset.isRealData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              No dataset found. Please upload and prepare your data first before proceeding to visualization.
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
            {/* Enhanced debug info for visualization */}
            <div className="text-xs text-gray-400 mt-2 font-mono">
              📊 Loaded: {dataset.rows.length} rows, {dataset.variables.length} variables
              | Session: {dataset.sessionId?.slice(-8) || 'N/A'}
              | {dataset.isRealData ? "Real Data" : "Sample Data"}
              | Prep: {Object.keys(dataset.prepChanges).length} steps applied
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

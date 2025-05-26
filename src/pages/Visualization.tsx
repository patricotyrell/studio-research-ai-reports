import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StepIndicator from '@/components/StepIndicator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, ArrowLeft, Upload } from 'lucide-react';
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
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎨 VISUALIZATION MODULE - Component mounted, loading data');
    console.log('🎨 VISUALIZATION MODULE - Current URL:', window.location.href);
    
    // Add a small delay to ensure any previous data operations are complete
    const loadData = async () => {
      try {
        // Force a small delay to ensure data stability
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const analysisDataset = getDatasetForAnalysis();
        
        console.log('🎨 VISUALIZATION MODULE - Dataset retrieval result:', {
          hasDataset: !!analysisDataset,
          source: analysisDataset?.source || 'None',
          variables: analysisDataset?.variables?.length || 0,
          rows: analysisDataset?.rows?.length || 0,
          isRealData: analysisDataset?.isRealData,
          fileName: analysisDataset?.metadata?.fileName
        });
        
        if (!analysisDataset) {
          console.error('❌ VISUALIZATION MODULE - No dataset returned from getDatasetForAnalysis');
          setDataError('NO_DATASET');
          setDataset(null);
        } else {
          console.log('✅ VISUALIZATION MODULE - Dataset successfully loaded:', {
            source: analysisDataset.source || 'Unknown',
            variables: analysisDataset.variables?.length || 0,
            rows: analysisDataset.rows?.length || 0,
            isRealData: analysisDataset.isRealData,
            fileName: analysisDataset.metadata?.fileName
          });
          
          setDataset(analysisDataset);
          setDataError(null);
        }
      } catch (error) {
        console.error('❌ VISUALIZATION MODULE - Error loading dataset:', error);
        setDataError('LOAD_ERROR');
        setDataset(null);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleVariableSelect = (variables: string[]) => {
    console.log('📊 VISUALIZATION MODULE - Variables selected:', variables);
    setSelectedVariables(variables);
  };

  const handleChartTypeSelect = (type: string) => {
    console.log('📊 VISUALIZATION MODULE - Chart type selected:', type);
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

  // Show error state if no dataset found
  if (dataError === 'NO_DATASET' || !dataset) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <StepIndicator 
            currentStep={4} 
            steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
          />
          
          <div className="max-w-2xl mx-auto mt-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-red-800 mb-2">No Dataset Found</p>
                    <p className="text-red-700">
                      We couldn't find any dataset to visualize. This could happen if:
                    </p>
                    <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                      <li>No data file has been uploaded yet</li>
                      <li>The dataset was cleared during navigation</li>
                      <li>There was an error processing your data</li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      onClick={() => navigate('/upload')} 
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Data
                    </Button>
                    <Button 
                      onClick={() => navigate('/sample-data')} 
                      variant="outline"
                    >
                      Try Sample Data
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Validate dataset structure - be more lenient
  if (!dataset.variables || dataset.variables.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <StepIndicator 
            currentStep={4} 
            steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
          />
          
          <div className="max-w-2xl mx-auto mt-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium text-yellow-800">Dataset Structure Issue</p>
                  <p className="text-yellow-700">
                    The dataset has no variables to visualize.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => navigate('/data-preparation')} size="sm">
                      Return to Data Prep
                    </Button>
                    <Button onClick={() => navigate('/upload')} size="sm" variant="outline">
                      Upload New Data
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
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
            <div className="text-xs text-gray-400 mt-2 font-mono bg-gray-100 p-2 rounded">
              📊 Dataset: {dataset.rows?.length || 0} rows, {dataset.variables?.length || 0} variables
              | Source: {dataset.metadata?.fileName || 'Unknown'}
              | Type: {dataset.isRealData ? "🔴 Real Data" : "🟡 Sample Data"}
              | Session: {dataset.sessionId?.slice(-8) || 'N/A'}
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
                    variables={dataset.variables || []}
                    selectedVariables={selectedVariables}
                    onVariableSelect={handleVariableSelect}
                    mode={explorationMode}
                  />
                  
                  <ChartTypeSelector
                    selectedVariables={selectedVariables}
                    variables={dataset.variables || []}
                    onChartTypeSelect={handleChartTypeSelect}
                    mode={explorationMode}
                  />
                  
                  <ChartValidationAlert
                    selectedVariables={selectedVariables}
                    chartType={chartType}
                    variables={dataset.variables || []}
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
                    data={dataset.rows || []}
                    variables={dataset.variables || []}
                    selectedVariables={selectedVariables}
                    chartType={chartType}
                    isValid={isValidConfiguration}
                  />
                </CardContent>
              </Card>

              {isValidConfiguration && (
                <InsightsPanel
                  data={dataset.rows || []}
                  variables={dataset.variables || []}
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

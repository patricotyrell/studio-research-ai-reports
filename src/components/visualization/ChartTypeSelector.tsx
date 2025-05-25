import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { getChartConfigurations } from '@/utils/chartSelectionUtils';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';
type VisualizationType = 'chart' | 'table';
type ExplorationMode = 'distribution' | 'relationship' | 'comparison';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  visualizationType: VisualizationType;
  explorationMode: ExplorationMode;
  canShowTable: boolean;
  relevantChartTypes: ChartType[];
  onChartTypeChange: (type: ChartType) => void;
  onVisualizationTypeChange: (type: VisualizationType) => void;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  chartType,
  visualizationType,
  explorationMode,
  canShowTable,
  relevantChartTypes,
  onChartTypeChange,
  onVisualizationTypeChange,
}) => {
  const chartConfigs = getChartConfigurations();
  
  return (
    <div className="space-y-6">
      {/* Visualization Type Selection */}
      {canShowTable && (
        <div className="space-y-2">
          <Label>Visualization Type</Label>
          <div className="flex space-x-2">
            <Button
              variant={visualizationType === 'chart' ? "default" : "outline"}
              size="sm"
              onClick={() => onVisualizationTypeChange('chart')}
              className="flex items-center gap-1"
              disabled={relevantChartTypes.length === 0}
            >
              <BarChartIcon className="h-4 w-4 mr-1" />
              Chart
            </Button>
            <Button
              variant={visualizationType === 'table' ? "default" : "outline"}
              size="sm"
              onClick={() => onVisualizationTypeChange('table')}
              className="flex items-center gap-1"
            >
              <TableIcon className="h-4 w-4 mr-1" />
              {explorationMode === 'distribution' ? "Frequency Table" : "Crosstab Table"}
            </Button>
          </div>
        </div>
      )}
      
      {visualizationType === 'chart' && relevantChartTypes.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="chart-type">Chart Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {relevantChartTypes.map((type) => {
              const config = chartConfigs[type];
              return (
                <button
                  key={type}
                  onClick={() => onChartTypeChange(type)}
                  className={`flex flex-col items-center p-3 border rounded-md transition-all ${
                    chartType === type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={config.description}
                >
                  <div className="mb-2">
                    {type === 'bar' && <BarChartIcon className="h-4 w-4" />}
                    {type === 'line' && <LineChartIcon className="h-4 w-4" />}
                    {type === 'pie' && <PieChartIcon className="h-4 w-4" />}
                    {type === 'scatter' && <ScatterChartIcon className="h-4 w-4" />}
                    {type === 'boxplot' && <LayoutGrid className="h-4 w-4" />}
                    {type === 'histogram' && <BarChartIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium">{config.title}</span>
                </button>
              );
            })}
          </div>
          
          {relevantChartTypes.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No suitable chart types available for the selected variable combination.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartTypeSelector;

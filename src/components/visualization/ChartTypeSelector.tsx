
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, LayoutGrid, Table as TableIcon } from 'lucide-react';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';
type VisualizationType = 'chart' | 'table';
type ExplorationMode = 'distribution' | 'relationship' | 'comparison';

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

interface ChartTypeSelectorProps {
  chartType: ChartType;
  visualizationType: VisualizationType;
  explorationMode: ExplorationMode;
  canShowTable: boolean;
  relevantChartTypes: ChartType[];
  onChartTypeChange: (type: ChartType) => void;
  onVisualizationTypeChange: (type: VisualizationType) => void;
}

const chartTypes: Record<ChartType, ChartConfig> = {
  'bar': {
    type: 'bar',
    title: 'Bar Chart',
    icon: <BarChartIcon className="h-4 w-4" />,
    description: 'Shows the distribution of categorical variables or comparisons between groups.',
    recommendedFor: {
      distribution: ['categorical'],
      comparison: ['categorical', 'numeric']
    }
  },
  'line': {
    type: 'line',
    title: 'Line Chart',
    icon: <LineChartIcon className="h-4 w-4" />,
    description: 'Shows trends over time or continuous variables.',
    recommendedFor: {
      relationship: ['numeric', 'date']
    }
  },
  'pie': {
    type: 'pie',
    title: 'Pie Chart',
    icon: <PieChartIcon className="h-4 w-4" />,
    description: 'Shows proportional distribution of categories.',
    recommendedFor: {
      distribution: ['categorical']
    }
  },
  'scatter': {
    type: 'scatter',
    title: 'Scatter Plot',
    icon: <ScatterChartIcon className="h-4 w-4" />,
    description: 'Shows relationship between two numeric variables.',
    recommendedFor: {
      relationship: ['numeric']
    }
  },
  'boxplot': {
    type: 'boxplot',
    title: 'Box Plot',
    icon: <LayoutGrid className="h-4 w-4" />,
    description: 'Shows distribution statistics for numeric data.',
    recommendedFor: {
      distribution: ['numeric'],
      comparison: ['numeric']
    }
  },
  'histogram': {
    type: 'histogram',
    title: 'Histogram',
    icon: <BarChartIcon className="h-4 w-4" />,
    description: 'Shows distribution of numeric variables in bins.',
    recommendedFor: {
      distribution: ['numeric']
    }
  }
};

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  chartType,
  visualizationType,
  explorationMode,
  canShowTable,
  relevantChartTypes,
  onChartTypeChange,
  onVisualizationTypeChange,
}) => {
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
      
      {visualizationType === 'chart' && (
        <div className="space-y-2">
          <Label htmlFor="chart-type">Chart Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {relevantChartTypes.map((type) => (
              <button
                key={type}
                onClick={() => onChartTypeChange(type)}
                className={`flex flex-col items-center p-3 border rounded-md transition-all ${
                  chartType === type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-2">
                  {chartTypes[type].icon}
                </div>
                <span className="text-xs font-medium">{chartTypes[type].title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTypeSelector;

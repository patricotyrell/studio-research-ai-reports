
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { getChartConfigurations } from '@/utils/chartSelectionUtils';
import { DataVariable } from '@/services/sampleDataService';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

interface ChartTypeSelectorProps {
  selectedVariables: string[];
  variables: DataVariable[];
  onChartTypeSelect: (type: string) => void;
  mode: 'guided' | 'custom';
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  selectedVariables,
  variables,
  onChartTypeSelect,
  mode,
}) => {
  const chartConfigs = getChartConfigurations();
  
  // Determine relevant chart types based on selected variables
  const getRelevantChartTypes = (): ChartType[] => {
    if (selectedVariables.length === 0) return [];
    
    if (selectedVariables.length === 1) {
      return ['bar', 'pie', 'histogram'];
    } else {
      return ['bar', 'line', 'scatter', 'boxplot'];
    }
  };

  const relevantChartTypes = getRelevantChartTypes();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Chart Type</h3>
      {relevantChartTypes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {relevantChartTypes.map((type) => {
            const config = chartConfigs[type];
            return (
              <button
                key={type}
                onClick={() => onChartTypeSelect(type)}
                className="flex flex-col items-center p-3 border rounded-md transition-all hover:border-primary hover:bg-primary/5"
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
      ) : (
        <p className="text-sm text-gray-500">
          Please select variables to see available chart types.
        </p>
      )}
    </div>
  );
};

export default ChartTypeSelector;

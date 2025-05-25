
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Brush } from 'recharts';
import { BarChart as BarChartIcon, TableIcon } from 'lucide-react';
import FrequencyTable from './FrequencyTable';
import CrosstabTable from './CrosstabTable';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';
type VisualizationType = 'chart' | 'table';
type ExplorationMode = 'distribution' | 'relationship' | 'comparison';

interface ChartRendererProps {
  chartType: ChartType;
  visualizationType: VisualizationType;
  explorationMode: ExplorationMode;
  chartData: any[];
  primaryVariable: string;
  secondaryVariable: string;
  frequencyTableData: { category: string; frequency: number; percentage: number }[];
  crosstabData: any;
  onDownloadTable: () => void;
  onAddToReport: () => void;
}

const CHART_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartType,
  visualizationType,
  explorationMode,
  chartData,
  primaryVariable,
  secondaryVariable,
  frequencyTableData,
  crosstabData,
  onDownloadTable,
  onAddToReport,
}) => {
  const renderChartByType = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BarChartIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Select your variables and click "Generate Chart"</p>
        </div>
      );
    }
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={explorationMode === 'distribution' ? "name" : "name"} label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: explorationMode === 'comparison' ? secondaryVariable : 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`${explorationMode === 'comparison' ? secondaryVariable : 'Value'}: ${payload[0].value}`}</p>
                        {payload[0].payload.count && <p className="text-sm text-gray-500">{`Count: ${payload[0].payload.count}`}</p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey={explorationMode === 'distribution' ? "value" : explorationMode === 'comparison' ? secondaryVariable : "value"} 
                name={explorationMode === 'comparison' ? secondaryVariable : primaryVariable} 
                fill="#4f46e5" 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: secondaryVariable, angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`${secondaryVariable || 'Value'}: ${payload[0].value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" name={secondaryVariable} stroke="#4f46e5" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{payload[0].name}</p>
                        <p className="text-sm">{`Value: ${payload[0].value}`}</p>
                        {payload[0].payload.count && <p className="text-sm text-gray-500">{`Count: ${payload[0].payload.count}`}</p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name={primaryVariable} label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis type="number" dataKey="y" name={secondaryVariable} label={{ value: secondaryVariable, angle: -90, position: 'insideLeft' }} />
              <ZAxis range={[60, 60]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">Data Point</p>
                        <p className="text-sm">{`${primaryVariable}: ${payload[0].value}`}</p>
                        <p className="text-sm">{`${secondaryVariable}: ${payload[1].value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Scatter name="Data Points" data={chartData} fill="#4f46e5" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'boxplot':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: secondaryVariable, angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`${secondaryVariable}: ${payload[0].value}`}</p>
                        {payload[0].payload.error && <p className="text-sm text-gray-500">{`Error: ±${payload[0].payload.error}`}</p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey={secondaryVariable} 
                name={secondaryVariable} 
                fill="#4f46e5" 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{`${primaryVariable}: ${label}`}</p>
                        <p className="text-sm">{`Frequency: ${payload[0].value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="frequency" fill="#4f46e5" />
              <Brush dataKey="bin" height={30} stroke="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return <p>Select a chart type</p>;
    }
  };

  if (visualizationType === 'chart') {
    return (
      <div className="h-[400px] w-full bg-white p-4 rounded-md">
        {renderChartByType()}
      </div>
    );
  } else if (explorationMode === 'distribution') {
    return (
      <div className="w-full bg-white p-4 rounded-md">
        {frequencyTableData.length > 0 ? (
          <FrequencyTable 
            data={frequencyTableData} 
            variableName={primaryVariable} 
            onDownload={onDownloadTable}
            onAddToReport={onAddToReport}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <TableIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Generate a frequency table to see the distribution</p>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="w-full bg-white p-4 rounded-md overflow-x-auto">
        {crosstabData ? (
          <CrosstabTable 
            data={crosstabData} 
            rowVariable={primaryVariable} 
            columnVariable={secondaryVariable}
            onDownload={onDownloadTable}
            onAddToReport={onAddToReport}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <TableIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Generate a crosstab table to see relationships</p>
          </div>
        )}
      </div>
    );
  }
};

export default ChartRenderer;

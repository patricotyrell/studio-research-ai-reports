
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Brush } from 'recharts';
import { BarChart as BarChartIcon, TableIcon } from 'lucide-react';
import { DataVariable } from '@/services/sampleDataService';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

interface ChartRendererProps {
  data: any[];
  variables: DataVariable[];
  selectedVariables: string[];
  chartType: ChartType;
  isValid: boolean;
}

const CHART_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

const ChartRenderer: React.FC<ChartRendererProps> = ({
  data,
  variables,
  selectedVariables,
  chartType,
  isValid,
}) => {
  // Process data for visualization based on selected variables and chart type
  const processDataForChart = () => {
    if (!isValid || selectedVariables.length === 0 || !data || data.length === 0) {
      return [];
    }

    console.log('📊 ChartRenderer - Processing data:', {
      selectedVariables,
      chartType,
      dataRows: data.length,
      sampleData: data.slice(0, 3)
    });

    const primaryVariable = selectedVariables[0];
    const secondaryVariable = selectedVariables[1];

    if (chartType === 'scatter' && selectedVariables.length >= 2) {
      // For scatter plots, we need numeric data points
      return data.slice(0, 1000).map((row, index) => ({
        x: parseFloat(row[primaryVariable]) || 0,
        y: parseFloat(row[secondaryVariable]) || 0,
        name: `Point ${index + 1}`
      })).filter(point => !isNaN(point.x) && !isNaN(point.y));
    }

    if (chartType === 'histogram') {
      // For histograms, create bins
      const values = data.map(row => parseFloat(row[primaryVariable])).filter(val => !isNaN(val));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 10;
      const binSize = (max - min) / binCount;
      
      const bins = Array(binCount).fill(0).map((_, i) => ({
        bin: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        frequency: 0,
        range: [min + i * binSize, min + (i + 1) * binSize]
      }));
      
      values.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        bins[binIndex].frequency++;
      });
      
      return bins;
    }

    // For other chart types, create frequency distribution
    const counts = {};
    data.forEach(row => {
      const value = row[primaryVariable];
      if (value !== undefined && value !== null && value !== '') {
        const key = String(value);
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 categories for readability
  };

  const chartData = processDataForChart();

  const renderChartByType = () => {
    if (!isValid || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BarChartIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            {!isValid ? "Select your variables and chart type to generate visualization" : "No data available for the selected variables"}
          </p>
        </div>
      );
    }
    
    const primaryVariable = selectedVariables[0];
    const secondaryVariable = selectedVariables[1];
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} 
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 80 : 60}
              />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`Frequency: ${payload[0].value}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="value" name={primaryVariable} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" name={primaryVariable} stroke="#4f46e5" activeDot={{ r: 8 }} />
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="x" 
                name={primaryVariable} 
                label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={secondaryVariable} 
                label={{ value: secondaryVariable, angle: -90, position: 'insideLeft' }} 
              />
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
      
      case 'boxplot':
        // Simplified boxplot as grouped bar chart showing quartiles
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: primaryVariable, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name={primaryVariable} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return <p>Select a chart type</p>;
    }
  };

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-md">
      {renderChartByType()}
    </div>
  );
};

export default ChartRenderer;

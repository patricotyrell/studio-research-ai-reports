
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { getDatasetPreviewRows } from '@/utils/dataUtils';

interface Column {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

interface AutoDataPreviewProps {
  columns: Column[];
}

const AutoDataPreview: React.FC<AutoDataPreviewProps> = ({ columns }) => {
  const previewRows = getDatasetPreviewRows();
  
  // Find the best categorical and numeric columns for preview
  const { categoricalColumn, numericColumn, categoricalData, numericData } = useMemo(() => {
    if (!previewRows || previewRows.length === 0 || columns.length === 0) {
      return { categoricalColumn: null, numericColumn: null, categoricalData: [], numericData: [] };
    }

    // Find the first categorical column with reasonable number of unique values
    const categoricalCol = columns.find(col => 
      col.type === 'categorical' && col.unique > 1 && col.unique <= 10
    );

    // Find the first numeric column
    const numericCol = columns.find(col => col.type === 'numeric');

    let categoricalData: any[] = [];
    let numericData: any[] = [];

    // Generate categorical data
    if (categoricalCol) {
      const frequency: { [key: string]: number } = {};
      previewRows.forEach(row => {
        const value = row[categoricalCol.name];
        if (value !== null && value !== undefined && value !== '') {
          const strValue = String(value);
          frequency[strValue] = (frequency[strValue] || 0) + 1;
        }
      });

      categoricalData = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
    }

    // Generate numeric data (histogram bins)
    if (numericCol) {
      const values = previewRows
        .map(row => parseFloat(row[numericCol.name]))
        .filter(val => !isNaN(val));

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(8, Math.max(4, Math.floor(values.length / 5)));
        const binSize = (max - min) / binCount;

        const bins: { [key: string]: number } = {};
        
        for (let i = 0; i < binCount; i++) {
          const binStart = min + i * binSize;
          const binEnd = i === binCount - 1 ? max + 0.001 : min + (i + 1) * binSize;
          const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
          bins[binLabel] = 0;
        }

        values.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
          const binStart = min + binIndex * binSize;
          const binEnd = binIndex === binCount - 1 ? max + 0.001 : min + (binIndex + 1) * binSize;
          const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
          bins[binLabel]++;
        });

        numericData = Object.entries(bins).map(([name, value]) => ({ name, value }));
      }
    }

    return { 
      categoricalColumn: categoricalCol, 
      numericColumn: numericCol, 
      categoricalData, 
      numericData 
    };
  }, [columns, previewRows]);

  // Don't render if no data available
  if (!categoricalColumn && !numericColumn) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Quick Data Preview (Auto-generated)
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          For full customization, continue to the Visualization module.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`grid ${categoricalColumn && numericColumn ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6 p-6`}>
          
          {/* Categorical Bar Chart */}
          {categoricalColumn && categoricalData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                {categoricalColumn.name} Distribution
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoricalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="font-medium text-xs">{label}</p>
                              <p className="text-xs text-blue-600">{`Count: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Numeric Histogram */}
          {numericColumn && numericData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {numericColumn.name} Distribution
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={numericData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow-sm">
                              <p className="font-medium text-xs">{`Range: ${label}`}</p>
                              <p className="text-xs text-green-600">{`Frequency: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoDataPreview;

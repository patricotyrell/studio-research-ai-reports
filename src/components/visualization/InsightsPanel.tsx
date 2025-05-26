
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Lightbulb } from 'lucide-react';
import { DataVariable } from '@/services/sampleDataService';

interface InsightsPanelProps {
  data: any[];
  variables: DataVariable[];
  selectedVariables: string[];
  chartType: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  data,
  variables,
  selectedVariables,
  chartType,
}) => {
  const [insights, setInsights] = useState<string>('');

  useEffect(() => {
    if (selectedVariables.length > 0 && chartType && data.length > 0) {
      generateInsights();
    }
  }, [selectedVariables, chartType, data]);

  const generateInsights = () => {
    const primaryVar = selectedVariables[0];
    const secondaryVar = selectedVariables[1];
    
    let insightText = `Analysis of ${primaryVar}`;
    if (secondaryVar) {
      insightText += ` and ${secondaryVar}`;
    }
    insightText += `:\n\n`;
    
    // Add basic insights based on chart type
    switch (chartType) {
      case 'bar':
        insightText += `• This bar chart shows the distribution or comparison of values\n`;
        insightText += `• Look for patterns in the heights of different bars\n`;
        break;
      case 'pie':
        insightText += `• This pie chart shows the proportional breakdown of categories\n`;
        insightText += `• Larger slices represent more common values\n`;
        break;
      case 'scatter':
        insightText += `• This scatter plot reveals relationships between variables\n`;
        insightText += `• Look for clustering, trends, or outliers in the data points\n`;
        break;
      case 'line':
        insightText += `• This line chart shows trends over time or ordered categories\n`;
        insightText += `• Look for upward/downward trends and sudden changes\n`;
        break;
      default:
        insightText += `• This ${chartType} chart provides insights into your data patterns\n`;
    }
    
    insightText += `\nDataset contains ${data.length} records for analysis.`;
    
    setInsights(insightText);
  };

  const handleCopyInsights = () => {
    navigator.clipboard.writeText(insights);
  };

  if (!insights) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyInsights}
          className="flex items-center gap-1"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 p-4 rounded-md text-gray-700">
          {insights.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;

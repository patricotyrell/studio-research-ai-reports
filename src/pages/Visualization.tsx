import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Brush } from 'recharts';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, Copy, PlusCircle, BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, ScatterChart as ScatterChartIcon, LayoutGrid } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';
import { getDatasetVariables } from '@/utils/dataUtils';
import { generateChartInsights } from '@/utils/visualizationUtils';
import { DataVariable } from '@/services/sampleDataService';

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';
type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

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

const Visualization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('distribution');
  const [primaryVariable, setPrimaryVariable] = useState<string>('');
  const [secondaryVariable, setSecondaryVariable] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<any[]>([]);
  const [variables, setVariables] = useState<DataVariable[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [hasGeneratedChart, setHasGeneratedChart] = useState(false);
  
  // Chart type configurations
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
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Load dataset variables
    const datasetVars = getDatasetVariables();
    if (!datasetVars || datasetVars.length === 0) {
      navigate('/data-overview');
      return;
    }
    
    setVariables(datasetVars);
    
    // Set default variables when variables are loaded
    if (datasetVars.length > 0) {
      // Find first categorical and numeric variables as defaults
      const categoricalVar = datasetVars.find(v => v.type === 'categorical')?.name;
      const numericVar = datasetVars.find(v => v.type === 'numeric')?.name;
      
      if (categoricalVar) {
        setPrimaryVariable(categoricalVar);
      } else {
        setPrimaryVariable(datasetVars[0].name);
      }
      
      if (numericVar) {
        setSecondaryVariable(numericVar);
      } else if (datasetVars.length > 1) {
        setSecondaryVariable(datasetVars[1].name);
      }
    }
  }, [navigate]);
  
  // Handle exploration mode change and recommend chart type
  useEffect(() => {
    if (primaryVariable && variables.length > 0) {
      recommendChartType();
    }
  }, [explorationMode, primaryVariable, secondaryVariable]);
  
  const getVariableType = (varName: string): string => {
    const variable = variables.find(v => v.name === varName);
    return variable ? variable.type : '';
  };
  
  const recommendChartType = () => {
    const primaryType = getVariableType(primaryVariable);
    const secondaryType = getVariableType(secondaryVariable);
    
    let recommendedChart: ChartType = 'bar'; // Default
    
    if (explorationMode === 'distribution') {
      if (primaryType === 'numeric') {
        recommendedChart = 'histogram';
      } else if (primaryType === 'categorical') {
        recommendedChart = 'bar';
      }
    } else if (explorationMode === 'relationship') {
      if (primaryType === 'numeric' && secondaryType === 'numeric') {
        recommendedChart = 'scatter';
      } else if (primaryType === 'date' || secondaryType === 'date') {
        recommendedChart = 'line';
      } else {
        recommendedChart = 'bar';
      }
    } else if (explorationMode === 'comparison') {
      if (primaryType === 'categorical' && secondaryType === 'numeric') {
        recommendedChart = 'bar';
      } else if (primaryType === 'categorical' && secondaryType === 'categorical') {
        recommendedChart = 'bar';
      } else if (primaryType === 'numeric' && secondaryType === 'categorical') {
        recommendedChart = 'bar';
      }
    }
    
    setChartType(recommendedChart);
  };
  
  const generateChart = () => {
    // Generate synthetic data based on selected variables and chart type
    let newChartData: any[] = [];
    
    if (explorationMode === 'distribution') {
      if (primaryVariable && getVariableType(primaryVariable) === 'categorical') {
        // Generate categorical distribution data
        newChartData = [
          { name: 'Category A', value: Math.floor(Math.random() * 40) + 10, count: Math.floor(Math.random() * 50) + 20 },
          { name: 'Category B', value: Math.floor(Math.random() * 40) + 10, count: Math.floor(Math.random() * 50) + 20 },
          { name: 'Category C', value: Math.floor(Math.random() * 40) + 10, count: Math.floor(Math.random() * 50) + 20 },
          { name: 'Category D', value: Math.floor(Math.random() * 40) + 10, count: Math.floor(Math.random() * 50) + 20 },
        ];
      } else {
        // Generate numeric distribution data (histogram)
        newChartData = [
          { bin: '0-10', frequency: Math.floor(Math.random() * 20) + 5 },
          { bin: '11-20', frequency: Math.floor(Math.random() * 30) + 10 },
          { bin: '21-30', frequency: Math.floor(Math.random() * 40) + 15 },
          { bin: '31-40', frequency: Math.floor(Math.random() * 30) + 10 },
          { bin: '41-50', frequency: Math.floor(Math.random() * 20) + 5 },
          { bin: '51+', frequency: Math.floor(Math.random() * 10) + 2 },
        ];
      }
    } else if (explorationMode === 'relationship') {
      // Generate relationship data
      if (chartType === 'scatter') {
        for (let i = 0; i < 30; i++) {
          newChartData.push({
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
          });
        }
      } else {
        newChartData = [
          { name: 'Jan', value: Math.floor(Math.random() * 100) },
          { name: 'Feb', value: Math.floor(Math.random() * 100) },
          { name: 'Mar', value: Math.floor(Math.random() * 100) },
          { name: 'Apr', value: Math.floor(Math.random() * 100) },
          { name: 'May', value: Math.floor(Math.random() * 100) },
          { name: 'Jun', value: Math.floor(Math.random() * 100) },
        ];
      }
    } else if (explorationMode === 'comparison') {
      // Generate comparison data
      newChartData = [
        { 
          name: 'Group A', 
          [secondaryVariable]: Math.floor(Math.random() * 100),
          error: Math.floor(Math.random() * 10) + 5
        },
        { 
          name: 'Group B', 
          [secondaryVariable]: Math.floor(Math.random() * 100),
          error: Math.floor(Math.random() * 10) + 5
        },
        { 
          name: 'Group C', 
          [secondaryVariable]: Math.floor(Math.random() * 100),
          error: Math.floor(Math.random() * 10) + 5
        },
      ];
    }
    
    setChartData(newChartData);
    setHasGeneratedChart(true);
    
    // Generate insights
    const insight = generateChartInsights(
      explorationMode,
      chartType,
      primaryVariable,
      secondaryVariable,
      getVariableType(primaryVariable),
      getVariableType(secondaryVariable),
      newChartData
    );
    
    setInsights(insight);
  };
  
  const downloadChart = () => {
    // In a real implementation, we'd use a library like html2canvas
    // to capture the chart as an image and download it
    toast({
      title: "Chart downloaded",
      description: "Your chart image has been downloaded as PNG",
    });
  };
  
  const addToReport = () => {
    // Save chart data and settings to localStorage for report generation
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable,
      secondaryVariable,
      explorationMode,
      insights
    }));
    
    toast({
      title: "Added to report",
      description: "Chart has been added to your report",
    });
  };
  
  const copyInsights = () => {
    navigator.clipboard.writeText(insights);
    toast({
      title: "Copied to clipboard",
      description: "AI insights have been copied to clipboard",
    });
  };
  
  const handleContinue = () => {
    // Make sure we save the chart data before navigating
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      primaryVariable,
      secondaryVariable,
      explorationMode,
      insights
    }));
    
    navigate('/analysis'); // Changed from '/report' to '/analysis'
  };
  
  // Filter chart types based on exploration mode
  const getRelevantChartTypes = (): ChartType[] => {
    const relevantTypes: ChartType[] = [];
    
    Object.entries(chartTypes).forEach(([type, config]) => {
      const chartType = type as ChartType;
      const primaryType = getVariableType(primaryVariable);
      const secondaryType = getVariableType(secondaryVariable);
      
      if (explorationMode === 'distribution' && config.recommendedFor.distribution?.includes(primaryType)) {
        relevantTypes.push(chartType);
      } else if (explorationMode === 'relationship' && 
                config.recommendedFor.relationship?.includes(primaryType) && 
                config.recommendedFor.relationship?.includes(secondaryType)) {
        relevantTypes.push(chartType);
      } else if (explorationMode === 'comparison' && config.recommendedFor.comparison?.includes(primaryType)) {
        relevantTypes.push(chartType);
      }
    });
    
    // If no relevant charts found, include default options
    if (relevantTypes.length === 0) {
      return ['bar', 'line', 'pie'];
    }
    
    return relevantTypes;
  };
  
  const renderChartByType = () => {
    const CHART_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

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
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={4} // Changed from 5 to 4 
          steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Visualization</h1>
              <p className="text-gray-600">
                Create insightful visualizations based on your data and get AI-powered interpretations.
              </p>
            </div>
          </div>
          
          {variables.length > 0 ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>What do you want to explore?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <RadioGroup 
                      value={explorationMode} 
                      onValueChange={(value) => setExplorationMode(value as ExplorationMode)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
                        <div className="mb-2 flex items-center justify-center">
                          <RadioGroupItem value="distribution" id="distribution" />
                        </div>
                        <Label htmlFor="distribution" className="font-medium text-center mb-1">Distribution of one variable</Label>
                        <p className="text-xs text-gray-500 text-center">Explore how values are distributed</p>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
                        <div className="mb-2 flex items-center justify-center">
                          <RadioGroupItem value="relationship" id="relationship" />
                        </div>
                        <Label htmlFor="relationship" className="font-medium text-center mb-1">Relationship between two variables</Label>
                        <p className="text-xs text-gray-500 text-center">Analyze correlations and patterns</p>
                      </div>
                      
                      <div className="flex flex-col items-center p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
                        <div className="mb-2 flex items-center justify-center">
                          <RadioGroupItem value="comparison" id="comparison" />
                        </div>
                        <Label htmlFor="comparison" className="font-medium text-center mb-1">Comparison across groups</Label>
                        <p className="text-xs text-gray-500 text-center">Compare measures across categories</p>
                      </div>
                    </RadioGroup>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primary-variable">
                          {explorationMode === 'distribution' ? 'Variable to analyze:' : 
                           explorationMode === 'relationship' ? 'First variable:' : 
                           'Grouping variable:'}
                        </Label>
                        <Select value={primaryVariable} onValueChange={setPrimaryVariable}>
                          <SelectTrigger id="primary-variable">
                            <SelectValue placeholder="Select variable" />
                          </SelectTrigger>
                          <SelectContent>
                            {variables.map(variable => (
                              <SelectItem key={variable.name} value={variable.name}>
                                {variable.name} ({variable.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {explorationMode !== 'distribution' && (
                        <div className="space-y-2">
                          <Label htmlFor="secondary-variable">
                            {explorationMode === 'relationship' ? 'Second variable:' : 'Measure to compare:'}
                          </Label>
                          <Select value={secondaryVariable} onValueChange={setSecondaryVariable}>
                            <SelectTrigger id="secondary-variable">
                              <SelectValue placeholder="Select variable" />
                            </SelectTrigger>
                            <SelectContent>
                              {variables.map(variable => (
                                <SelectItem key={variable.name} value={variable.name}>
                                  {variable.name} ({variable.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {getRelevantChartTypes().map((type) => (
                          <button
                            key={type}
                            onClick={() => setChartType(type)}
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
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={generateChart}
                        className="bg-research-700 hover:bg-research-800"
                      >
                        Generate Chart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Chart Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadChart}
                      disabled={!hasGeneratedChart}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addToReport}
                      disabled={!hasGeneratedChart}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add to Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full bg-white p-4 rounded-md">
                    {renderChartByType()}
                  </div>
                </CardContent>
              </Card>
              
              {hasGeneratedChart && insights && (
                <Card className="mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>AI Insights</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyInsights}
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
              )}
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleContinue}
                  className="bg-research-700 hover:bg-research-800"
                  disabled={!hasGeneratedChart}
                >
                  Continue to Analysis
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center flex flex-col items-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                <p>No variables found. Please complete data preparation first.</p>
                <Button 
                  onClick={() => navigate('/data-preparation')} 
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Data Preparation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Visualization;

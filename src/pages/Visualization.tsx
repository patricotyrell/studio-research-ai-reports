
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';

interface AnalysisResult {
  type: string;
  description: string;
  pValue: number;
  significant: boolean;
  statistic: number;
  interpretation: string;
}

const CHART_COLORS = ['#4f46e5', '#2563eb', '#0891b2', '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

const Visualization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartData, setChartData] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string>('gender');
  const [measure, setMeasure] = useState<string>('satisfaction');
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if analysis was completed
    const result = localStorage.getItem('analysisResult');
    if (!result) {
      navigate('/analysis');
      return;
    }
    
    setAnalysisResult(JSON.parse(result));
    
    // In a real app, we would load real data
    // For demo, generate synthetic chart data
    generateSyntheticData();
  }, [navigate]);
  
  // Re-generate data when chart settings change
  useEffect(() => {
    generateSyntheticData();
  }, [groupBy, measure, chartType]);
  
  const generateSyntheticData = () => {
    if (groupBy === 'gender') {
      const data = [
        { name: 'Male', value: Math.floor(Math.random() * 5) + 3, count: 42 },
        { name: 'Female', value: Math.floor(Math.random() * 5) + 3, count: 58 },
        { name: 'Other', value: Math.floor(Math.random() * 5) + 3, count: 12 },
      ];
      setChartData(data);
    } else if (groupBy === 'age_group') {
      const data = [
        { name: '18-24', value: Math.floor(Math.random() * 5) + 3, count: 18 },
        { name: '25-34', value: Math.floor(Math.random() * 5) + 3, count: 32 },
        { name: '35-44', value: Math.floor(Math.random() * 5) + 3, count: 24 },
        { name: '45-54', value: Math.floor(Math.random() * 5) + 3, count: 15 },
        { name: '55+', value: Math.floor(Math.random() * 5) + 3, count: 11 },
      ];
      setChartData(data);
    } else if (groupBy === 'education') {
      const data = [
        { name: 'High School', value: Math.floor(Math.random() * 5) + 3, count: 22 },
        { name: "Bachelor's", value: Math.floor(Math.random() * 5) + 3, count: 45 },
        { name: "Master's", value: Math.floor(Math.random() * 5) + 3, count: 25 },
        { name: 'PhD', value: Math.floor(Math.random() * 5) + 3, count: 8 },
      ];
      setChartData(data);
    }
  };
  
  const renderChartByType = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`${measure}: ${payload[0].value}`}</p>
                        <p className="text-sm text-gray-500">{`Count: ${payload[0].payload.count}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="value" name={measure} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">{`${measure}: ${payload[0].value}`}</p>
                        <p className="text-sm text-gray-500">{`Count: ${payload[0].payload.count}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" name={measure} stroke="#4f46e5" activeDot={{ r: 8 }} />
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
                        <p className="text-sm">{`${measure}: ${payload[0].value}`}</p>
                        <p className="text-sm text-gray-500">{`Count: ${payload[0].payload.count}`}</p>
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
      
      default:
        return <p>Select a chart type</p>;
    }
  };
  
  const downloadChart = () => {
    // In a real implementation, we'd use a library like html2canvas
    // to capture the chart as an image and download it
    toast({
      title: "Chart downloaded",
      description: "Your chart image has been downloaded",
    });
  };
  
  const handleContinue = () => {
    // Save chart data and settings to localStorage for report generation
    localStorage.setItem('chartData', JSON.stringify({
      type: chartType,
      data: chartData,
      groupBy,
      measure
    }));
    
    navigate('/report');
  };
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={5} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Visualization</h1>
              <p className="text-gray-600">
                Create and customize visualizations based on your analysis results.
              </p>
            </div>
          </div>
          
          {analysisResult ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Visualization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Chart Type</Label>
                      <RadioGroup 
                        value={chartType} 
                        onValueChange={(value) => setChartType(value as 'bar' | 'line' | 'pie')}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bar" id="bar" />
                          <Label htmlFor="bar">Bar Chart</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="line" id="line" />
                          <Label htmlFor="line">Line Chart</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pie" id="pie" />
                          <Label htmlFor="pie">Pie Chart</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="group-by">Group By</Label>
                      <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger id="group-by">
                          <SelectValue placeholder="Select variable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gender">Gender</SelectItem>
                          <SelectItem value="age_group">Age Group</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="measure">Measure</Label>
                      <Select value={measure} onValueChange={setMeasure}>
                        <SelectTrigger id="measure">
                          <SelectValue placeholder="Select variable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="satisfaction">Satisfaction</SelectItem>
                          <SelectItem value="likelihood">Recommendation Likelihood</SelectItem>
                          <SelectItem value="price">Price Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Chart Preview</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadChart}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full bg-white p-4 rounded-md">
                    {renderChartByType()}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleContinue}
                  className="bg-research-700 hover:bg-research-800"
                >
                  Continue to Report Generation
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center flex flex-col items-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                <p>No analysis results found. Please complete analysis first.</p>
                <Button 
                  onClick={() => navigate('/analysis')} 
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Analysis
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

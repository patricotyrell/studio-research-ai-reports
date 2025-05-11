
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StepIndicator from '@/components/StepIndicator';
import { FileText, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from "@/components/ui/progress";

// Sample data structure
interface Column {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  dateUploaded: string;
  rows: number;
  columns: number;
}

const DataOverview = () => {
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  
  // Check if user is logged in and has a current file
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const currentFile = localStorage.getItem('currentFile');
    if (!currentFile) {
      navigate('/upload');
      return;
    }
    
    setFileInfo(JSON.parse(currentFile));
    
    // In a real app, we would retrieve the actual data from the server
    // For this demo, we'll generate synthetic column data
    generateSyntheticColumns();
  }, [navigate]);
  
  const generateSyntheticColumns = () => {
    // Generate synthetic column data for demonstration purposes
    const sampleColumns: Column[] = [
      { name: 'respondent_id', type: 'numeric', missing: 0, unique: 150, example: '1001' },
      { name: 'age', type: 'numeric', missing: 5, unique: 45, example: '32' },
      { name: 'gender', type: 'categorical', missing: 2, unique: 3, example: 'Female' },
      { name: 'education', type: 'categorical', missing: 8, unique: 5, example: 'Bachelor\'s degree' },
      { name: 'satisfaction', type: 'numeric', missing: 0, unique: 10, example: '4' },
      { name: 'likelihood_to_recommend', type: 'numeric', missing: 3, unique: 10, example: '8' },
      { name: 'feedback', type: 'text', missing: 45, unique: 95, example: 'The service was excellent' },
      { name: 'purchase_date', type: 'date', missing: 12, unique: 65, example: '2023-06-15' },
      { name: 'product_category', type: 'categorical', missing: 0, unique: 6, example: 'Electronics' },
      { name: 'price_paid', type: 'numeric', missing: 7, unique: 98, example: '299.99' }
    ];
    
    setColumns(sampleColumns);
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'categorical': return 'bg-purple-100 text-purple-800';
      case 'numeric': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleContinue = () => {
    navigate('/data-preparation');
  };
  
  if (!fileInfo) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          Loading data...
        </div>
      </DashboardLayout>
    );
  }
  
  const missingDataPercentage = columns.length > 0 
    ? (columns.reduce((acc, col) => acc + col.missing, 0) / (fileInfo.rows * columns.length)) * 100 
    : 0;
    
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={2} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Overview</h1>
              <p className="text-gray-600">
                Review your dataset to understand its structure and content before proceeding to analysis.
              </p>
            </div>
            <Button 
              className="bg-research-700 hover:bg-research-800"
              onClick={handleContinue}
            >
              Continue to Data Preparation
            </Button>
          </div>
          
          {/* File information */}
          <Card className="mb-6">
            <CardHeader className="py-4 px-6">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Filename</p>
                  <p className="font-medium">{fileInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Type</p>
                  <p className="font-medium">{fileInfo.type.split('/')[1]?.toUpperCase() || fileInfo.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="font-medium">{new Date(fileInfo.dateUploaded).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rows (Observations)</p>
                  <p className="font-medium">{fileInfo.rows}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Columns (Variables)</p>
                  <p className="font-medium">{fileInfo.columns}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Missing Data</p>
                  <div className="flex items-center gap-2">
                    <Progress value={100 - missingDataPercentage} className="h-2" />
                    <span className="text-sm">{missingDataPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Data preview */}
          <Card className="mb-6">
            <CardHeader className="py-4 px-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Variable Summary</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Numeric</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Categorical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Text</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Date</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Missing Values</TableHead>
                      <TableHead>Unique Values</TableHead>
                      <TableHead>Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell className="font-medium">{column.name}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(column.type)}>
                            {column.type.charAt(0).toUpperCase() + column.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {column.missing > 0 ? (
                            <span className="flex items-center text-amber-600">
                              {column.missing} 
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 ml-1" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {Math.round((column.missing / fileInfo.rows) * 100)}% missing values
                                </TooltipContent>
                              </Tooltip>
                            </span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                        <TableCell>{column.unique}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{column.example}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Data quality insights */}
          <Card>
            <CardHeader className="py-4 px-6">
              <CardTitle className="flex items-center text-lg">
                <Info className="h-5 w-5 mr-2" />
                Data Quality Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-6">
              <ul className="space-y-2">
                {columns.some(col => col.missing > 0) && (
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Missing values detected in {columns.filter(col => col.missing > 0).length} columns. 
                      You'll be able to handle these in the data preparation step.
                    </span>
                  </li>
                )}
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    {columns.filter(col => col.type === 'categorical').length} categorical variables detected, 
                    which can be used for grouping in your analysis.
                  </span>
                </li>
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    {columns.filter(col => col.type === 'numeric').length} numeric variables detected, 
                    suitable for statistical analysis like means, correlations, and t-tests.
                  </span>
                </li>
                {columns.some(col => col.type === 'text') && (
                  <li className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Open-ended text responses found. These can be analyzed for themes and patterns.
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataOverview;

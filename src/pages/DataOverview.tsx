import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import StepIndicator from '@/components/StepIndicator';
import PaginatedDataPreview from '@/components/PaginatedDataPreview';
import DataQualityChecks from '@/components/DataQualityChecks';
import AutoDataPreview from '@/components/AutoDataPreview';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { getDatasetVariables, getCurrentFile, getCurrentProject } from '@/utils/dataUtils';
import { getDatasetPreviewRows } from '@/utils/dataUtils';
import { analyzeDataQuality, DataQualityReport } from '@/services/dataQualityService';

interface Column {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
}

const DataOverview = () => {
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState<any | null>(null);
  const [projectInfo, setProjectInfo] = useState<any | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  
  // Check if user is logged in and has a current file
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const currentFile = getCurrentFile();
    const currentProject = getCurrentProject();
    
    if (!currentFile) {
      navigate('/upload');
      return;
    }
    
    setFileInfo(currentFile);
    setProjectInfo(currentProject);
    
    // Get variables from sample data or user uploaded file
    const variables = getDatasetVariables();
    const previewRows = getDatasetPreviewRows();
    
    if (variables.length > 0) {
      setColumns(variables);
      
      // Perform data quality analysis
      const report = analyzeDataQuality(variables, previewRows);
      setQualityReport(report);
    } else {
      generateSyntheticColumns();
    }
  }, [navigate]);
  
  const generateSyntheticColumns = () => {
    const sampleColumns: Column[] = [
      { name: 'ID', type: 'numeric', missing: 0, unique: 100, example: '1' },
      { name: 'Gender', type: 'categorical', missing: 0, unique: 2, example: 'Male' },
      { name: 'Age', type: 'numeric', missing: 0, unique: 48, example: '35' },
      { name: 'Smoking_Status', type: 'categorical', missing: 0, unique: 2, example: 'Non-Smoker' },
      { name: 'Exercise_Level', type: 'categorical', missing: 0, unique: 3, example: 'Low' },
      { name: 'BMI', type: 'numeric', missing: 0, unique: 74, example: '35.6' },
      { name: 'Has_Hypertension', type: 'categorical', missing: 0, unique: 2, example: 'No' },
      { name: 'Health_Score', type: 'numeric', missing: 0, unique: 57, example: '98' }
    ];
    
    setColumns(sampleColumns);
  };
  
  const handleContinue = () => {
    navigate('/data-preparation');
  };
  
  const handleFixIssue = (issueId: string) => {
    // Navigate to data preparation with focus on specific issue
    navigate('/data-preparation', { state: { focusIssue: issueId } });
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
  
  // Calculate data quality metrics
  const totalMissingValues = columns.reduce((acc, col) => acc + col.missing, 0);
  const hasNoDuplicates = true; // Placeholder for duplicate detection logic
  const hasConsistentValues = columns.filter(col => col.type === 'categorical').length > 0;
    
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={2} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Overview</h1>
              <p className="text-gray-600">
                Review your uploaded dataset to understand its structure and quality before proceeding.
              </p>
            </div>
            <Button 
              className="bg-research-700 hover:bg-research-800"
              onClick={handleContinue}
            >
              Continue to Data Preparation
            </Button>
          </div>
          
          {/* File Summary - Made more compact */}
          <Card className="mb-6">
            <CardHeader className="py-3 px-6">
              <CardTitle className="text-base">File Summary</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">File</p>
                  <p className="font-medium text-sm">{fileInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rows</p>
                  <p className="font-medium text-sm">{fileInfo.rows}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Columns</p>
                  <p className="font-medium text-sm">{fileInfo.columns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Variables Summary */}
          <Card className="mb-6">
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-lg">Variables</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">Name</TableHead>
                        <TableHead className="font-medium">Type</TableHead>
                        <TableHead className="font-medium">Missing</TableHead>
                        <TableHead className="font-medium">Unique</TableHead>
                        <TableHead className="font-medium">Example</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {columns.map((column) => (
                        <TableRow key={column.name}>
                          <TableCell className="font-medium py-3">{column.name}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant="secondary" className={
                              column.type === 'text' ? "bg-blue-100 text-blue-800" :
                              column.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                              column.type === 'numeric' ? "bg-green-100 text-green-800" :
                              "bg-orange-100 text-orange-800"
                            }>
                              {column.type.charAt(0).toUpperCase() + column.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={column.missing > 0 ? "text-amber-600" : "text-green-600"}>
                              {column.missing}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">{column.unique}</TableCell>
                          <TableCell className="py-3 max-w-[200px] truncate">{column.example}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Auto-Generated Data Preview Charts */}
          <AutoDataPreview columns={columns} />
          
          {/* Data Preview */}
          <div className="mb-6">
            <PaginatedDataPreview />
          </div>
          
          {/* Enhanced Data Quality Checks */}
          {qualityReport && (
            <div className="mb-6">
              <DataQualityChecks 
                qualityReport={qualityReport}
                onFixIssue={handleFixIssue}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataOverview;

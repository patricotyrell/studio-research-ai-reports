
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
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { getDatasetVariables, getCurrentFile, getCurrentProject } from '@/utils/dataUtils';
import { getDatasetPreviewRows } from '@/utils/dataUtils';
import { analyzeDataQuality, DataQualityReport } from '@/services/dataQualityService';
import { getDatasetRowCount, getDatasetMetadata } from '@/utils/datasetCache';

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
  const [loading, setLoading] = useState(true);
  
  // Check if user is logged in and has a current file
  useEffect(() => {
    console.log('🔍 DataOverview - Loading data...');
    
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Get data from dataset cache
    const variables = getDatasetVariables();
    const previewRows = getDatasetPreviewRows();
    const totalRows = getDatasetRowCount();
    const metadata = getDatasetMetadata();
    
    console.log('📊 DataOverview - Dataset info:', {
      variables: variables.length,
      previewRows: previewRows.length,
      totalRows,
      metadata
    });
    
    // Get file and project info
    const currentFile = getCurrentFile();
    const currentProject = getCurrentProject();
    
    // Update file info with actual data counts
    const updatedFileInfo = currentFile ? {
      ...currentFile,
      rows: totalRows,
      columns: variables.length
    } : {
      name: metadata?.fileName || 'Unknown Dataset',
      rows: totalRows,
      columns: variables.length
    };
    
    setFileInfo(updatedFileInfo);
    setProjectInfo(currentProject);
    
    if (variables.length > 0) {
      // Convert variables to column format with sample data analysis
      const columnsData: Column[] = variables.map(variable => {
        const values = previewRows.map(row => row[variable.name]).filter(val => val !== null && val !== undefined);
        const uniqueValues = new Set(values).size;
        const missingCount = previewRows.length - values.length;
        const exampleValue = values.length > 0 ? String(values[0]) : '';
        
        // Detect type based on data
        let detectedType: 'text' | 'categorical' | 'numeric' | 'date' = 'text';
        if (variable.type === 'numeric' || values.some(val => !isNaN(parseFloat(String(val))))) {
          detectedType = 'numeric';
        } else if (uniqueValues < values.length * 0.5 && uniqueValues < 20) {
          detectedType = 'categorical';
        }
        
        return {
          name: variable.name,
          type: detectedType,
          missing: missingCount,
          unique: uniqueValues,
          example: exampleValue
        };
      });
      
      setColumns(columnsData);
      
      // Perform data quality analysis
      if (previewRows.length > 0) {
        const report = analyzeDataQuality(variables, previewRows);
        setQualityReport(report);
      }
    }
    
    setLoading(false);
  }, [navigate]);
  
  const handleContinue = () => {
    navigate('/data-preparation');
  };
  
  const handleFixIssue = (issueId: string) => {
    // Navigate to data preparation with focus on specific issue
    navigate('/data-preparation', { state: { focusIssue: issueId } });
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-700 mx-auto mb-4"></div>
          Loading data overview...
        </div>
      </DashboardLayout>
    );
  }
  
  if (!fileInfo || columns.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-lg p-6">
            <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-800 mb-2">No Data Found</h3>
            <p className="text-amber-700 mb-4">
              Please upload a file first to view the data overview.
            </p>
            <Button onClick={() => navigate('/upload')} className="bg-research-700 hover:bg-research-800">
              Upload Data
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
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
                  <p className="font-medium text-sm">{fileInfo.rows?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Columns</p>
                  <p className="font-medium text-sm">{fileInfo.columns || 0}</p>
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

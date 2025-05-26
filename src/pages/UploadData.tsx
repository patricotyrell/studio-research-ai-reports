
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectNameDialog from '@/components/ProjectNameDialog';
import SheetSelectionDialog from '@/components/SheetSelectionDialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { processFileData, createProject } from '@/utils/dataUtils';
import { getExcelSheetInfo } from '@/utils/excelUtils';

interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

const UploadData = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [processedData, setProcessedData] = useState<any>(null);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    // Check file size (10MB limit for localStorage safety)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload a file smaller than 10MB to ensure optimal performance.',
      });
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast.error('Invalid file format', {
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls).',
      });
      return;
    }
    
    setFile(selectedFile);
    
    // If it's an Excel file, check for multiple sheets
    if (isExcel) {
      try {
        const sheets = await getExcelSheetInfo(selectedFile);
        
        if (sheets.length > 1) {
          setAvailableSheets(sheets);
          setShowSheetDialog(true);
          return;
        }
        
        // Single sheet or default to first sheet
        await processFile(selectedFile);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error('Error reading Excel file', {
          description: error instanceof Error ? error.message : 'Failed to read the Excel file structure',
        });
        setFile(null);
      }
    } else {
      // Process CSV file directly
      await processFile(selectedFile);
    }
  };

  const handleSheetSelection = async (sheetName: string) => {
    setShowSheetDialog(false);
    if (file) {
      await processFile(file, sheetName);
    }
  };

  const handleSheetCancel = () => {
    setShowSheetDialog(false);
    setFile(null);
    setAvailableSheets([]);
  };

  const processFile = async (selectedFile: File, selectedSheet?: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Processing file:', selectedFile.name, 'Size:', selectedFile.size);
      
      const processed = await processFileData(selectedFile, selectedSheet);
      console.log('File processed successfully:', {
        variables: processed.variables.length,
        totalRows: processed.totalRows,
        previewRows: processed.previewRows.length
      });
      
      setProcessedData(processed);
      
      // Store minimal file info only (avoid localStorage quota issues)
      const fileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        dateUploaded: new Date().toISOString(),
        rows: processed.totalRows,
        columns: processed.variables.length,
        selectedSheet: selectedSheet || undefined
      };
      
      // Store essential data with error handling
      try {
        localStorage.setItem('currentFile', JSON.stringify(fileInfo));
        localStorage.setItem('processedData', JSON.stringify({
          variables: processed.variables,
          previewRows: processed.previewRows,
          totalRows: processed.totalRows
        }));
        localStorage.setItem('isSampleData', 'false');
      } catch (storageError) {
        console.warn('localStorage quota exceeded, using memory-only mode:', storageError);
        toast.warning('Large file detected', {
          description: 'Your file is being processed in memory-optimized mode for better performance.',
        });
      }
      
      setShowProjectDialog(true);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file', {
        description: error instanceof Error ? error.message : 'Failed to process the uploaded file. Please check the file format and try again.',
      });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProjectCreate = (projectName: string) => {
    if (!file || !processedData) return;
    
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      dateUploaded: new Date().toISOString(),
      rows: processedData.totalRows,
      columns: processedData.variables.length
    };
    
    // Create and save the project (only essential data)
    try {
      createProject(projectName, fileInfo, {
        variables: processedData.variables,
        previewRows: processedData.previewRows,
        totalRows: processedData.totalRows
      });
      
      toast.success('Project created successfully', {
        description: `"${projectName}" is ready for analysis`,
      });
      
      setShowProjectDialog(false);
      navigate('/data-overview');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error creating project', {
        description: 'Failed to create project. Please try again.',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-research-900 mb-2">Upload Your Data</h1>
            <p className="text-gray-600">
              Upload a CSV or Excel file to begin your research analysis. We'll process your data and guide you through the preparation steps.
            </p>
          </div>
          
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
            <CardContent className="p-8">
              <div 
                className={`flex flex-col items-center justify-center h-60 rounded-lg transition-colors ${
                  isDragging 
                    ? 'bg-research-50 border-2 border-dashed border-research-300' 
                    : file 
                      ? 'bg-green-50 border-2 border-dashed border-green-300'
                      : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-research-700 mx-auto mb-4"></div>
                    <p className="text-research-700 font-medium">Processing your file...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a moment for large files</p>
                  </div>
                ) : file ? (
                  <div className="text-center">
                    <div className="p-3 rounded-full bg-green-100 mb-4 mx-auto w-fit">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-lg font-medium text-green-700 mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFile(null);
                        setProcessedData(null);
                      }}
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-research-100 mb-6">
                      <Upload className="h-12 w-12 text-research-700" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Data File</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                      Drag and drop your CSV or Excel file here, or click to browse and select a file from your computer.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <Button 
                        className="bg-research-700 hover:bg-research-800"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>CSV or Excel files (.csv, .xlsx, .xls) • Max 10MB</span>
                    </div>
                  </>
                )}
                
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* File Requirements */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">File Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• CSV or Excel format (.csv, .xlsx, .xls) with headers in the first row</li>
              <li>• Maximum file size: 10MB for optimal performance</li>
              <li>• UTF-8 encoding recommended for CSV files</li>
              <li>• Each column should represent a variable/question</li>
              <li>• For Excel files with multiple sheets, you'll be prompted to select one</li>
            </ul>
          </div>
        </div>
      </div>
      
      <SheetSelectionDialog
        open={showSheetDialog}
        sheets={availableSheets}
        onSelectSheet={handleSheetSelection}
        onCancel={handleSheetCancel}
      />
      
      <ProjectNameDialog
        open={showProjectDialog}
        onConfirm={handleProjectCreate}
        title="Name Your Project"
        description="Give your research project a descriptive name to help you identify it later."
      />
    </DashboardLayout>
  );
};

export default UploadData;

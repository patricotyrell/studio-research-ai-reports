
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectNameDialog from '@/components/ProjectNameDialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StepIndicator from '@/components/StepIndicator';
import { processCSVData, saveProject } from '@/utils/dataUtils';

const UploadData = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is logged in
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
    }
  }, [navigate]);

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setError(null);
    
    // Check file type
    const allowedTypes = ['.csv', '.xls', '.xlsx'];
    const fileExtension = uploadedFile.name.substring(uploadedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Invalid file format. Please upload a CSV or Excel file.');
      return;
    }
    
    setFile(uploadedFile);
    setLoading(true);
    
    try {
      // Process CSV data
      const data = await processCSVData(uploadedFile);
      setProcessedData(data);
      
      // Store processed data temporarily
      localStorage.setItem('processedData', JSON.stringify(data));
      
      toast({
        title: "File processed successfully",
        description: `Found ${data.variables.length} variables and ${data.totalRows} rows.`,
      });
      
      setLoading(false);
      setShowProjectDialog(true);
    } catch (error: any) {
      setError(error.message || 'Failed to process file');
      setLoading(false);
    }
  };

  const handleProjectName = (projectName: string) => {
    if (!file || !processedData) return;
    
    // Create project information
    const projectInfo = {
      id: Date.now().toString(),
      name: projectName,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Store file information
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      dateUploaded: new Date().toISOString(),
      rows: processedData.totalRows,
      columns: processedData.variables.length
    };
    
    // Save to localStorage
    saveProject(projectInfo);
    localStorage.setItem('currentFile', JSON.stringify(fileInfo));
    localStorage.setItem('isSampleData', 'false');
    
    // Clear any previous prep steps
    localStorage.removeItem('completedPrepSteps');
    localStorage.removeItem('preparedVariables');
    
    setShowProjectDialog(false);
    navigate('/data-overview');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={1} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-3xl mx-auto mt-6">
          <h1 className="text-3xl font-bold text-research-900 mb-2">Upload Your Research Data</h1>
          <p className="text-gray-600 mb-6">
            Upload a CSV or Excel file containing your survey data to begin analysis.
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
            <CardContent className="p-8">
              <div 
                className={`flex flex-col items-center justify-center h-40 rounded-lg ${isDragging ? 'bg-research-50 border-2 border-dashed border-research-300' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="p-3 rounded-full bg-research-100 mb-4">
                  <Upload className="h-6 w-6 text-research-700" />
                </div>
                
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV or Excel files (max 10MB)</p>
                
                {file && (
                  <div className="mt-4 p-2 bg-research-100 rounded text-sm text-research-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
                
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex justify-center mt-6">
                <Button 
                  className="bg-research-700 hover:bg-research-800"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Browse Files'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Guidelines for Successful Upload</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>File must be in CSV or Excel format</li>
              <li>Data should be in tabular format with headers in the first row</li>
              <li>Missing values should be left empty or marked as NA</li>
              <li>For best results, ensure your variables have descriptive names</li>
            </ul>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Need a sample file to test? <a href="#" className="text-research-700 hover:underline">Download sample CSV</a>
            </p>
          </div>
        </div>
        
        <ProjectNameDialog
          open={showProjectDialog}
          onConfirm={handleProjectName}
          defaultName={file ? file.name.replace(/\.[^/.]+$/, "") : ""}
          title="Name Your Project"
          description="Give your research project a descriptive name to help you identify it later."
        />
      </div>
    </DashboardLayout>
  );
};

export default UploadData;

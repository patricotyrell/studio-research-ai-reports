
import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const DataUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

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
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls).",
        variant: "destructive",
      });
      return;
    }
    
    setFileName(file.name);
    toast({
      title: "File uploaded successfully",
      description: `${file.name} has been uploaded and is ready for analysis.`,
    });
    
    // In a real application, we would process the file here
    console.log('File uploaded:', file);
  };

  return (
    <section className="py-12">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-research-900 mb-4">
            Upload Your Research Data
          </h2>
          <p className="text-gray-600">
            Upload your survey data as a CSV or Excel file to begin analysis. We support data from all major survey platforms.
          </p>
        </div>
        
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
              <p className="text-xs text-gray-500">CSV or Excel files (.csv, .xlsx, .xls) • Max 10MB</p>
              
              {fileName && (
                <div className="mt-4 p-2 bg-research-100 rounded text-sm text-research-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
              
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                className="bg-research-700 hover:bg-research-800"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need a sample file to test? <a href="#" className="text-research-700 hover:underline">Download sample CSV</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default DataUpload;

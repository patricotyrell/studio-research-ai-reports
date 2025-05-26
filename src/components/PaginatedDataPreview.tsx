
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getDatasetVariables, getCurrentFile, getFullDatasetRows } from '@/utils/dataUtils';

const PaginatedDataPreview: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentRows, setCurrentRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const rowsPerPage = 10;
  
  const variables = getDatasetVariables();
  const fileInfo = getCurrentFile();
  
  console.log('PaginatedDataPreview - Debug Info:');
  console.log('- variables count:', variables?.length);
  console.log('- fileInfo:', fileInfo);
  
  // Load data for current page with enhanced error handling and timeout
  const loadPageData = async (page: number, isRetry: boolean = false) => {
    setLoading(true);
    setError(null);
    setLoadingTimeout(false);
    
    if (!isRetry) {
      setRetryCount(0);
    }
    
    try {
      console.log(`Starting to load page ${page} data...`);
      
      // Set a shorter timeout for better UX
      const timeoutDuration = 5000; // 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          setLoadingTimeout(true);
          reject(new Error('Loading timed out - please try again'));
        }, timeoutDuration);
      });
      
      const dataPromise = getFullDatasetRows(page, rowsPerPage);
      
      const rows = await Promise.race([dataPromise, timeoutPromise]) as any[];
      
      console.log(`Successfully loaded page ${page} data:`, rows.length, 'rows');
      if (rows.length > 0) {
        console.log('First row sample:', Object.keys(rows[0]).slice(0, 3));
        console.log('Row data preview:', rows[0]);
      }
      
      setCurrentRows(rows);
      setError(null);
      setLoadingTimeout(false);
      
    } catch (error) {
      console.error('Error loading page data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      setCurrentRows([]);
      
      if (errorMessage.includes('timeout')) {
        setLoadingTimeout(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Retry function
  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    console.log(`Retrying data load (attempt ${newRetryCount})`);
    loadPageData(currentPage, true);
  };
  
  // Load initial data with immediate first page loading
  useEffect(() => {
    if (variables.length > 0 && fileInfo) {
      console.log('Loading initial data for page 0...');
      loadPageData(currentPage);
    }
  }, [variables.length, fileInfo]);
  
  // Load new page data when page changes
  useEffect(() => {
    if (variables.length > 0 && fileInfo && currentPage > 0) {
      console.log(`Page changed to ${currentPage}, loading new data...`);
      loadPageData(currentPage);
    }
  }, [currentPage]);
  
  if (!fileInfo || !variables || variables.length === 0) {
    return (
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500">No data available for preview.</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: Variables: {variables?.length || 0}, File: {fileInfo ? 'present' : 'missing'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const columnNames = variables.map(v => v.name);
  const totalRows = fileInfo.rows || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  
  const handlePrevious = () => {
    if (currentPage > 0 && !loading) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages - 1 && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const isPreviousDisabled = currentPage === 0 || loading;
  const isNextDisabled = currentPage >= totalPages - 1 || loading;
  
  // Show large dataset warning for files over 10k rows
  const isLargeDataset = totalRows > 10000;
  
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Data Preview</CardTitle>
          {isLargeDataset && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Large dataset: {totalRows.toLocaleString()} rows - Loading in chunks
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-700 mb-3"></div>
            <span className="text-gray-600 text-sm">
              {loadingTimeout ? 'Still loading preview...' : 'Loading data chunk...'}
            </span>
            <span className="text-gray-400 text-xs mt-1">
              Page {currentPage + 1} of {totalPages}
              {isLargeDataset && ' • Large dataset detected'}
            </span>
            {loadingTimeout && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetry}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Cancel & Retry
              </Button>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <div className="text-red-600 text-sm mb-2">
              {loadingTimeout ? 'Preview timed out' : 'Failed to load data'}
            </div>
            <div className="text-gray-500 text-xs mb-4 text-center max-w-md">
              {error}
              {retryCount > 0 && ` (Attempt ${retryCount})`}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetry}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {loadingTimeout ? 'Reload preview' : 'Retry'}
              </Button>
              {currentPage > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCurrentPage(0);
                    setError(null);
                  }}
                >
                  Back to first page
                </Button>
              )}
            </div>
          </div>
        ) : currentRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <span className="text-gray-500 mb-2">No data available for this page</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetry}
            >
              Try loading again
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnNames.map((column) => (
                    <TableHead key={column} className="font-medium whitespace-nowrap">{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row, rowIndex) => {
                  const actualRowIndex = startIndex + rowIndex;
                  
                  return (
                    <TableRow key={actualRowIndex}>
                      {columnNames.map((column) => {
                        const cellValue = row[column];
                        
                        return (
                          <TableCell key={`${actualRowIndex}-${column}`} className="py-2 whitespace-nowrap">
                            {cellValue === null || cellValue === undefined || cellValue === '' ? (
                              <span className="text-gray-300 italic">null</span>
                            ) : (
                              String(cellValue)
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalRows.toLocaleString()} rows
            {isLargeDataset && (
              <span className="text-orange-600 ml-2">(Chunked loading enabled)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isPreviousDisabled}
              className="flex items-center gap-1"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={isNextDisabled}
              className="flex items-center gap-1"
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaginatedDataPreview;

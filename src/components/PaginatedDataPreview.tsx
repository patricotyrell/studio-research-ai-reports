
import React, { useState, useEffect, useCallback } from 'react';
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
  const rowsPerPage = 10;
  
  const variables = getDatasetVariables();
  const fileInfo = getCurrentFile();
  
  console.log('PaginatedDataPreview - Current state:', {
    variables: variables?.length,
    fileInfo: fileInfo?.name,
    currentPage,
    loading,
    currentRowsCount: currentRows.length
  });
  
  // Simplified data loading function
  const loadPageData = useCallback(async (page: number) => {
    if (!variables || variables.length === 0 || !fileInfo) {
      console.log('Skipping load - no variables or file info');
      return;
    }
    
    console.log(`Starting to load page ${page} data...`);
    setLoading(true);
    setError(null);
    
    try {
      const rows = await getFullDatasetRows(page, rowsPerPage);
      console.log(`Successfully loaded page ${page}:`, rows.length, 'rows', rows);
      
      if (rows.length === 0 && page === 0) {
        setError('No data found. Please check your file format and try again.');
        setCurrentRows([]);
      } else {
        setCurrentRows(rows);
        setError(null);
      }
      
    } catch (error) {
      console.error('Error loading page data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(`Loading failed: ${errorMessage}`);
      setCurrentRows([]);
    } finally {
      setLoading(false);
    }
  }, [variables, fileInfo, rowsPerPage]);
  
  // Load data when component mounts or page changes
  useEffect(() => {
    if (variables.length > 0 && fileInfo) {
      console.log(`Effect triggered: Loading data for page ${currentPage}`);
      loadPageData(currentPage);
    } else {
      console.log('Effect triggered but missing data:', {
        variablesLength: variables.length,
        hasFileInfo: !!fileInfo
      });
    }
  }, [currentPage, variables.length, fileInfo, loadPageData]);
  
  // Retry function
  const handleRetry = useCallback(() => {
    console.log('Retrying data load');
    setError(null);
    loadPageData(currentPage);
  }, [currentPage, loadPageData]);
  
  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentPage > 0 && !loading) {
      console.log('Going to previous page');
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage, loading]);
  
  const handleNext = useCallback(() => {
    const totalRows = fileInfo?.rows || 0;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    if (currentPage < totalPages - 1 && !loading) {
      console.log('Going to next page');
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, fileInfo?.rows, loading, rowsPerPage]);
  
  // Early return for no data
  if (!fileInfo || !variables || variables.length === 0) {
    return (
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500">No data available for preview.</p>
        </CardContent>
      </Card>
    );
  }
  
  const columnNames = variables.map(v => v.name);
  const totalRows = fileInfo.rows || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const isLargeDataset = totalRows > 10000;
  
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Data Preview</CardTitle>
          {isLargeDataset && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Large dataset: {totalRows.toLocaleString()} rows
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-32 p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-research-700 mr-2"></div>
            <span className="text-gray-600 text-sm">
              Loading page {currentPage + 1}...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <div className="text-red-600 text-sm mb-2">Preview Error</div>
            <div className="text-gray-500 text-xs mb-4 text-center max-w-md">{error}</div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry Preview
            </Button>
          </div>
        ) : currentRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <span className="text-gray-500 mb-2">No data found for this page</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Reload Preview
            </Button>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnNames.map((column) => (
                    <TableHead key={column} className="font-medium whitespace-nowrap">
                      {column}
                    </TableHead>
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
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalRows.toLocaleString()} rows
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 0 || loading}
              className="flex items-center gap-1"
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
              disabled={currentPage >= totalPages - 1 || loading}
              className="flex items-center gap-1"
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


import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDatasetVariables, getCurrentFile, getFullDatasetRows } from '@/utils/dataUtils';

const PaginatedDataPreview: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentRows, setCurrentRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rowsPerPage = 10;
  
  const variables = getDatasetVariables();
  const fileInfo = getCurrentFile();
  
  console.log('PaginatedDataPreview - Debug Info:');
  console.log('- variables count:', variables?.length);
  console.log('- fileInfo:', fileInfo);
  
  // Load data for current page with error handling and timeout
  const loadPageData = async (page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - data chunk too large')), 10000);
      });
      
      const dataPromise = getFullDatasetRows(page, rowsPerPage);
      
      const rows = await Promise.race([dataPromise, timeoutPromise]) as any[];
      
      console.log(`Successfully loaded page ${page} data:`, rows.length, 'rows');
      if (rows.length > 0) {
        console.log('First row sample:', rows[0]);
      }
      setCurrentRows(rows);
    } catch (error) {
      console.error('Error loading page data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setCurrentRows([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load initial data
  useEffect(() => {
    if (variables.length > 0 && fileInfo) {
      loadPageData(currentPage);
    }
  }, [variables.length, fileInfo, currentPage]);
  
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
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const isPreviousDisabled = currentPage === 0;
  const isNextDisabled = currentPage >= totalPages - 1;
  
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-lg">Data Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-700 mb-3"></div>
            <span className="text-gray-600 text-sm">Loading data chunk...</span>
            <span className="text-gray-400 text-xs mt-1">Page {currentPage + 1} of {totalPages}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 p-6">
            <div className="text-red-600 text-sm mb-2">Failed to load data</div>
            <div className="text-gray-500 text-xs mb-4">{error}</div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadPageData(currentPage)}
            >
              Retry
            </Button>
          </div>
        ) : currentRows.length === 0 ? (
          <div className="flex items-center justify-center h-40 p-6">
            <span className="text-gray-500">No data available for this page</span>
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
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isPreviousDisabled || loading}
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
              disabled={isNextDisabled || loading}
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

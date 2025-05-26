
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
  const rowsPerPage = 10;
  
  const variables = getDatasetVariables();
  const fileInfo = getCurrentFile();
  
  console.log('PaginatedDataPreview - Debug Info:');
  console.log('- variables count:', variables?.length);
  console.log('- fileInfo:', fileInfo);
  console.log('- Variables:', variables?.map(v => ({ name: v.name, type: v.type, example: v.example })));
  
  // Load data for current page
  const loadPageData = async (page: number) => {
    setLoading(true);
    try {
      const rows = await getFullDatasetRows(page, rowsPerPage);
      console.log(`Loaded page ${page} data:`, rows.length, 'rows');
      console.log('First row sample:', rows[0]);
      setCurrentRows(rows);
    } catch (error) {
      console.error('Error loading page data:', error);
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
  
  console.log('PaginatedDataPreview - Pagination Info:');
  console.log('- totalPages:', totalPages);
  console.log('- currentPage:', currentPage);
  console.log('- currentRows.length:', currentRows.length);
  console.log('- startIndex:', startIndex, 'endIndex:', endIndex);
  
  const handlePrevious = () => {
    console.log('Previous button clicked, current page:', currentPage);
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      console.log('Moving to page:', newPage);
      setCurrentPage(newPage);
    }
  };
  
  const handleNext = () => {
    console.log('Next button clicked, current page:', currentPage, 'total pages:', totalPages);
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      console.log('Moving to page:', newPage);
      setCurrentPage(newPage);
    }
  };
  
  const isPreviousDisabled = currentPage === 0;
  const isNextDisabled = currentPage >= totalPages - 1;
  
  console.log('Navigation state - isPreviousDisabled:', isPreviousDisabled, 'isNextDisabled:', isNextDisabled);
  
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-lg">Data Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-700"></div>
            <span className="ml-2 text-gray-600">Loading data...</span>
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
                  console.log(`Rendering row ${actualRowIndex}:`, row);
                  
                  return (
                    <TableRow key={actualRowIndex}>
                      {columnNames.map((column) => {
                        const cellValue = row[column];
                        console.log(`Cell [${actualRowIndex}][${column}]:`, cellValue, typeof cellValue);
                        
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

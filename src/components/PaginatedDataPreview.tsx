
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDatasetVariables, getCurrentFile, getFullDatasetRows } from '@/utils/dataUtils';

const PaginatedDataPreview: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;
  
  const variables = getDatasetVariables();
  const fileInfo = getCurrentFile();
  
  // Get all available rows for pagination
  const allRows = getFullDatasetRows();
  
  console.log('PaginatedDataPreview - Debug Info:');
  console.log('- variables count:', variables?.length);
  console.log('- allRows count:', allRows?.length);
  console.log('- fileInfo:', fileInfo);
  console.log('- First row data:', allRows?.[0]);
  console.log('- Variables:', variables?.map(v => ({ name: v.name, type: v.type, example: v.example })));
  
  if (!allRows || allRows.length === 0 || !variables || variables.length === 0) {
    return (
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500">No data available for preview.</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: Variables: {variables?.length || 0}, Rows: {allRows?.length || 0}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const columnNames = variables.map(v => v.name);
  const totalPages = Math.ceil(allRows.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = allRows.slice(startIndex, endIndex);
  
  console.log('PaginatedDataPreview - Pagination Info:');
  console.log('- totalPages:', totalPages);
  console.log('- currentPage:', currentPage);
  console.log('- currentRows.length:', currentRows.length);
  console.log('- startIndex:', startIndex, 'endIndex:', endIndex);
  console.log('- Current page data sample:', currentRows?.[0]);
  
  const handlePrevious = () => {
    console.log('Previous button clicked, current page:', currentPage);
    if (currentPage > 0) {
      setCurrentPage(prev => {
        const newPage = prev - 1;
        console.log('Moving to page:', newPage);
        return newPage;
      });
    }
  };
  
  const handleNext = () => {
    console.log('Next button clicked, current page:', currentPage, 'total pages:', totalPages);
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => {
        const newPage = prev + 1;
        console.log('Moving to page:', newPage);
        return newPage;
      });
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
        
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, allRows.length)} of {allRows.length} rows
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

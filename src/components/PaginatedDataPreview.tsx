
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDatasetPreviewRows } from '@/utils/dataUtils';

const PaginatedDataPreview: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;
  
  const allRows = getDatasetPreviewRows();
  
  console.log('PaginatedDataPreview - allRows:', allRows);
  console.log('PaginatedDataPreview - allRows.length:', allRows?.length);
  
  if (!allRows || allRows.length === 0) {
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
  
  const columnNames = Object.keys(allRows[0]);
  const totalPages = Math.ceil(allRows.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = allRows.slice(startIndex, endIndex);
  
  console.log('PaginatedDataPreview - totalPages:', totalPages);
  console.log('PaginatedDataPreview - currentPage:', currentPage);
  console.log('PaginatedDataPreview - currentRows.length:', currentRows.length);
  
  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
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
              {currentRows.map((row, rowIndex) => (
                <TableRow key={startIndex + rowIndex}>
                  {columnNames.map((column) => (
                    <TableCell key={`${startIndex + rowIndex}-${column}`} className="py-2 whitespace-nowrap">
                      {row[column] === null || row[column] === undefined || row[column] === '' ? (
                        <span className="text-gray-300 italic">null</span>
                      ) : (
                        String(row[column])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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
              disabled={currentPage === 0}
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
              disabled={currentPage === totalPages - 1}
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

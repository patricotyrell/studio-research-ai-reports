
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, CheckCircle } from 'lucide-react';
import { getDatasetPreviewRows, hasDatasetBeenModified } from '@/utils/dataUtils';

interface DataPreviewProps {
  maxRows?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({ maxRows = 5 }) => {
  const previewRows = getDatasetPreviewRows();
  const isModified = hasDatasetBeenModified();
  
  if (!previewRows || previewRows.length === 0) {
    return null;
  }
  
  // Get column names from the first row
  const columnNames = Object.keys(previewRows[0]);
  
  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6">
        <CardTitle className="flex items-center text-lg">
          <Database className="h-5 w-5 mr-2" />
          Data Preview
          {isModified && (
            <div className="ml-2 flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <CheckCircle className="h-4 w-4 mr-1" />
              Prepared
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columnNames.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.slice(0, maxRows).map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columnNames.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>
                      {row[column] === null ? (
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
      </CardContent>
    </Card>
  );
};

export default DataPreview;

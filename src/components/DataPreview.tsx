
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from 'lucide-react';
import { getDatasetPreviewRows } from '@/utils/dataUtils';

interface DataPreviewProps {
  maxRows?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({ maxRows = 5 }) => {
  const previewRows = getDatasetPreviewRows();
  
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

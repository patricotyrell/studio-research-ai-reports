
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CrosstabDataCell {
  count: number;
  rowPercent: number;
  colPercent: number;
  totalPercent: number;
}

interface CrosstabData {
  rows: string[];
  columns: string[];
  data: Record<string, Record<string, CrosstabDataCell>>;
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}

interface CrosstabTableProps {
  data: CrosstabData;
  rowVariable: string;
  columnVariable: string;
  onDownload: () => void;
  onAddToReport: () => void;
}

type PercentageDisplay = 'none' | 'row' | 'column' | 'total';

const CrosstabTable: React.FC<CrosstabTableProps> = ({ 
  data, 
  rowVariable, 
  columnVariable,
  onDownload,
  onAddToReport
}) => {
  const { toast } = useToast();
  const [percentageDisplay, setPercentageDisplay] = useState<PercentageDisplay>('none');
  
  if (!data || !data.rows || !data.columns) {
    return <p className="text-center text-gray-500 my-8">No data available for crosstabulation.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-medium">
          Crosstabulation: {rowVariable} by {columnVariable}
        </h3>
        <div className="flex gap-2 items-center">
          <Select value={percentageDisplay} onValueChange={(val) => setPercentageDisplay(val as PercentageDisplay)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show counts only" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Show counts only</SelectItem>
              <SelectItem value="row">Row percentages</SelectItem>
              <SelectItem value="column">Column percentages</SelectItem>
              <SelectItem value="total">Total percentages</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddToReport}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add to Report
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border-r">{rowVariable} \ {columnVariable}</TableHead>
              {data.columns.map((col, idx) => (
                <TableHead key={idx} className="text-center">{col}</TableHead>
              ))}
              <TableHead className="text-center bg-gray-50">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                <TableCell className="font-medium border-r">{row}</TableCell>
                {data.columns.map((col, colIdx) => {
                  const cell = data.data[row]?.[col];
                  if (!cell) return <TableCell key={colIdx} className="text-center">-</TableCell>;
                  
                  let secondaryText = null;
                  if (percentageDisplay === 'row') {
                    secondaryText = <div className="text-xs text-gray-500">({cell.rowPercent.toFixed(1)}%)</div>;
                  } else if (percentageDisplay === 'column') {
                    secondaryText = <div className="text-xs text-gray-500">({cell.colPercent.toFixed(1)}%)</div>;
                  } else if (percentageDisplay === 'total') {
                    secondaryText = <div className="text-xs text-gray-500">({cell.totalPercent.toFixed(1)}%)</div>;
                  }
                  
                  return (
                    <TableCell key={colIdx} className="text-center">
                      {cell.count}
                      {secondaryText}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center font-medium bg-gray-50">
                  {data.rowTotals[row]}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50">
              <TableCell className="font-medium border-r">Total</TableCell>
              {data.columns.map((col, idx) => (
                <TableCell key={idx} className="text-center font-medium">{data.columnTotals[col]}</TableCell>
              ))}
              <TableCell className="text-center font-medium">{data.grandTotal}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CrosstabTable;

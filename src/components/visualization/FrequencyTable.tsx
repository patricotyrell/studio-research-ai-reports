
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FrequencyTableProps {
  data: {
    category: string;
    frequency: number;
    percentage: number;
  }[];
  variableName: string;
  onDownload: () => void;
  onAddToReport: () => void;
}

const FrequencyTable: React.FC<FrequencyTableProps> = ({ 
  data, 
  variableName,
  onDownload,
  onAddToReport
}) => {
  const { toast } = useToast();
  
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 my-8">No data available for frequency analysis.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Frequency Distribution: {variableName}</h3>
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{variableName}</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className="text-right">{row.frequency}</TableCell>
                <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FrequencyTable;

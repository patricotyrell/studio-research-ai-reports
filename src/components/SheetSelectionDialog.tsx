
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from 'lucide-react';

interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

interface SheetSelectionDialogProps {
  open: boolean;
  sheets: SheetInfo[];
  onSelectSheet: (sheetName: string) => void;
  onCancel: () => void;
}

const SheetSelectionDialog = ({ open, sheets, onSelectSheet, onCancel }: SheetSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Excel Sheet</DialogTitle>
          <DialogDescription>
            This Excel file contains multiple sheets. Please select which sheet you'd like to import.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {sheets.map((sheet) => (
            <Card 
              key={sheet.name} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onSelectSheet(sheet.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-research-100">
                    <FileSpreadsheet className="h-4 w-4 text-research-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{sheet.name}</h4>
                    <p className="text-xs text-gray-500">
                      {sheet.rowCount} rows • {sheet.columnCount} columns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSelectSheet(sheets[0]?.name)}
            className="bg-research-700 hover:bg-research-800"
          >
            Use First Sheet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SheetSelectionDialog;

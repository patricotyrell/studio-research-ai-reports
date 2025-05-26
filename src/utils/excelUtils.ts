
import * as XLSX from 'xlsx';
import { DataVariable } from '@/services/sampleDataService';

export interface ExcelParseResult {
  variables: DataVariable[];
  previewRows: any[];
  totalRows: number;
  sheetNames: string[];
  selectedSheet: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

// Get information about all sheets in an Excel file
export const getExcelSheetInfo = async (file: File): Promise<SheetInfo[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetInfo: SheetInfo[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          
          return {
            name: sheetName,
            rowCount: range.e.r + 1,
            columnCount: range.e.c + 1
          };
        });
        
        resolve(sheetInfo);
      } catch (error) {
        reject(new Error('Failed to read Excel file structure'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Parse Excel file data from a specific sheet
export const parseExcelFile = async (file: File, sheetName?: string): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use specified sheet or default to first sheet
        const selectedSheetName = sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[selectedSheetName];
        
        if (!worksheet) {
          reject(new Error(`Sheet "${selectedSheetName}" not found`));
          return;
        }
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        // Extract headers and data
        const headers = (jsonData[0] as any[]).map(h => String(h || '').trim()).filter(h => h !== '');
        const dataRows = jsonData.slice(1).map((row: any) => {
          const rowData: any = {};
          headers.forEach((header, index) => {
            const value = row[index];
            rowData[header] = value !== undefined && value !== null ? String(value).trim() : null;
          });
          return rowData;
        }).filter(row => Object.values(row).some(val => val !== null && val !== ''));
        
        if (headers.length === 0) {
          reject(new Error('No valid column headers found'));
          return;
        }
        
        // Analyze variables
        const variables: DataVariable[] = headers.map(header => {
          const values = dataRows.map(row => row[header]).filter(v => v !== null && v !== '');
          const uniqueValues = [...new Set(values)];
          const missingCount = dataRows.length - values.length;
          
          // Determine variable type
          let type: 'text' | 'categorical' | 'numeric' | 'date' = 'text';
          
          // Check if numeric
          const numericValues = values.filter(v => !isNaN(Number(v)) && v !== '');
          if (numericValues.length === values.length && values.length > 0) {
            type = 'numeric';
          } else if (uniqueValues.length <= 10 && values.length > uniqueValues.length * 2) {
            // If unique values are few and repeated, likely categorical
            type = 'categorical';
          } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
            // Basic date pattern check
            type = 'date';
          }

          // For categorical variables, create a mapping of original labels to numeric codes
          const coding: { [key: string]: number } = {};
          if (type === 'categorical') {
            uniqueValues.forEach((value, index) => {
              coding[value] = index;
            });
          }
          
          return {
            name: header,
            type,
            missing: missingCount,
            unique: uniqueValues.length,
            example: values[0] || 'N/A',
            coding: type === 'categorical' ? coding : undefined,
            originalCategories: type === 'categorical' ? uniqueValues : undefined
          };
        });
        
        // Get preview rows (first 5)
        const previewRows = dataRows.slice(0, 5);
        
        resolve({
          variables,
          previewRows,
          totalRows: dataRows.length,
          sheetNames: workbook.SheetNames,
          selectedSheet: selectedSheetName
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

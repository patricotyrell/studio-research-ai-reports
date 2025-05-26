
import { DataVariable } from '@/services/sampleDataService';

interface DatasetCache {
  allRows: any[];
  variables: DataVariable[];
  metadata: {
    fileName: string;
    totalRows: number;
    totalColumns: number;
    uploadedAt: string;
  } | null;
}

// Single source of truth for dataset
let datasetCache: DatasetCache = {
  allRows: [],
  variables: [],
  metadata: null
};

// Store the complete dataset in memory
export const setDatasetCache = (rows: any[], variables: DataVariable[], metadata: any) => {
  console.log('Setting dataset cache:', {
    rows: rows.length,
    variables: variables.length,
    metadata
  });
  
  datasetCache = {
    allRows: rows,
    variables,
    metadata
  };
  
  // Also store basic info in localStorage for persistence
  try {
    localStorage.setItem('datasetMetadata', JSON.stringify(metadata));
  } catch (e) {
    console.warn('Could not save metadata to localStorage:', e);
  }
};

// Get dataset variables
export const getDatasetVariables = (): DataVariable[] => {
  return datasetCache.variables;
};

// Get paginated rows
export const getDatasetRows = (page: number = 0, rowsPerPage: number = 10): any[] => {
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  console.log(`Getting rows ${startIndex} to ${endIndex} from cache:`, {
    totalRows: datasetCache.allRows.length,
    requestedPage: page,
    rowsPerPage
  });
  
  return datasetCache.allRows.slice(startIndex, endIndex);
};

// Get preview rows (first 5)
export const getDatasetPreviewRows = (): any[] => {
  return datasetCache.allRows.slice(0, 5);
};

// Get total row count
export const getDatasetRowCount = (): number => {
  return datasetCache.allRows.length;
};

// Get dataset metadata
export const getDatasetMetadata = () => {
  return datasetCache.metadata;
};

// Check if dataset is loaded
export const isDatasetLoaded = (): boolean => {
  return datasetCache.allRows.length > 0 && datasetCache.variables.length > 0;
};

// Clear the cache
export const clearDatasetCache = () => {
  console.log('Clearing dataset cache');
  datasetCache = {
    allRows: [],
    variables: [],
    metadata: null
  };
  localStorage.removeItem('datasetMetadata');
};

// Initialize cache from sample data (for demo mode)
export const initializeSampleDataCache = (sampleData: any) => {
  if (sampleData?.variables && sampleData?.previewRows) {
    // Generate extended rows for sample data
    const extendedRows = [];
    const baseRows = sampleData.previewRows;
    const totalToGenerate = 100; // Generate 100 sample rows
    
    for (let i = 0; i < totalToGenerate; i++) {
      const baseRow = baseRows[i % baseRows.length];
      const modifiedRow = { ...baseRow };
      
      // Modify IDs and names to create unique rows
      Object.keys(modifiedRow).forEach(key => {
        if (modifiedRow[key] && typeof modifiedRow[key] === 'string') {
          if (key.toLowerCase().includes('id')) {
            modifiedRow[key] = `${modifiedRow[key]}_${i + 1}`;
          }
        }
      });
      
      extendedRows.push(modifiedRow);
    }
    
    setDatasetCache(extendedRows, sampleData.variables, {
      fileName: 'Sample Dataset',
      totalRows: extendedRows.length,
      totalColumns: sampleData.variables.length,
      uploadedAt: new Date().toISOString()
    });
  }
};

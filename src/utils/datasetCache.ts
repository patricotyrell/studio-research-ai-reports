
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
  originalRows: any[]; // Keep original data for reset purposes
  originalVariables: DataVariable[]; // Keep original variables
  // Track preparation changes for consistency
  prepChanges: {
    [stepName: string]: any;
  };
  isRealData: boolean; // Flag to distinguish real vs sample data
}

// Single source of truth for dataset
let datasetCache: DatasetCache = {
  allRows: [],
  variables: [],
  metadata: null,
  originalRows: [],
  originalVariables: [],
  prepChanges: {},
  isRealData: false
};

// Store the complete dataset in memory
export const setDatasetCache = (rows: any[], variables: DataVariable[], metadata: any, isRealData: boolean = true) => {
  console.log('Setting dataset cache:', {
    rows: rows.length,
    variables: variables.length,
    metadata,
    isRealData
  });
  
  datasetCache = {
    allRows: [...rows], // Copy arrays to avoid mutation
    variables: [...variables],
    metadata,
    originalRows: [...rows], // Store original data
    originalVariables: [...variables],
    prepChanges: {}, // Reset prep changes when setting new data
    isRealData
  };
  
  // Also store basic info in localStorage for persistence
  try {
    localStorage.setItem('datasetMetadata', JSON.stringify({
      ...metadata,
      isRealData,
      totalRows: rows.length
    }));
  } catch (e) {
    console.warn('Could not save metadata to localStorage:', e);
  }
};

// Update dataset with modified data (for data prep steps) - ONLY when explicitly called
export const updateDatasetCache = (rows: any[], variables: DataVariable[], stepName?: string, changes?: any) => {
  console.log('Updating dataset cache with modified data:', {
    rows: rows.length,
    variables: variables.length,
    stepName,
    changes,
    wasRealData: datasetCache.isRealData
  });
  
  // CRITICAL: Only update if we have real data, don't let sample data override
  if (!datasetCache.isRealData && rows.length < 1000) {
    console.warn('Preventing sample data from overriding real dataset');
    return;
  }
  
  // Update the current state but preserve original data
  datasetCache.allRows = [...rows];
  datasetCache.variables = [...variables];
  
  // Store the changes for this step
  if (stepName && changes) {
    datasetCache.prepChanges[stepName] = changes;
    console.log('Stored prep changes for step:', stepName, changes);
  }
  
  // Update metadata row count if changed
  if (datasetCache.metadata) {
    datasetCache.metadata = {
      ...datasetCache.metadata,
      totalRows: rows.length,
      totalColumns: variables.length
    };
  }
  
  // Persist the updated state to localStorage
  try {
    localStorage.setItem('currentDatasetState', JSON.stringify({
      variables: datasetCache.variables,
      prepChanges: datasetCache.prepChanges,
      metadata: datasetCache.metadata,
      totalRows: rows.length
    }));
  } catch (e) {
    console.warn('Could not persist dataset state:', e);
  }
};

// Reset to original data (useful for starting fresh)
export const resetDatasetCache = () => {
  console.log('Resetting dataset cache to original data');
  datasetCache.allRows = [...datasetCache.originalRows];
  datasetCache.variables = [...datasetCache.originalVariables];
  datasetCache.prepChanges = {};
  
  if (datasetCache.metadata) {
    datasetCache.metadata = {
      ...datasetCache.metadata,
      totalRows: datasetCache.originalRows.length,
      totalColumns: datasetCache.originalVariables.length
    };
  }
  
  // Clear persisted state
  localStorage.removeItem('currentDatasetState');
};

// Get dataset variables (always return current state)
export const getDatasetVariables = (): DataVariable[] => {
  return [...datasetCache.variables]; // Return copy to prevent mutation
};

// Get paginated rows
export const getDatasetRows = (page: number = 0, rowsPerPage: number = 10): any[] => {
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  console.log(`Getting rows ${startIndex} to ${endIndex} from cache:`, {
    totalRows: datasetCache.allRows.length,
    requestedPage: page,
    rowsPerPage,
    isRealData: datasetCache.isRealData
  });
  
  return datasetCache.allRows.slice(startIndex, endIndex);
};

// Get preview rows (first 5)
export const getDatasetPreviewRows = (): any[] => {
  return datasetCache.allRows.slice(0, 5);
};

// Get all rows (for processing) - CRITICAL: Return complete dataset
export const getAllDatasetRows = (): any[] => {
  console.log('Getting all dataset rows:', {
    count: datasetCache.allRows.length,
    isRealData: datasetCache.isRealData
  });
  return [...datasetCache.allRows]; // Return copy to prevent mutation
};

// Get total row count
export const getDatasetRowCount = (): number => {
  return datasetCache.allRows.length;
};

// Get dataset metadata
export const getDatasetMetadata = () => {
  return datasetCache.metadata;
};

// Get preparation changes for a specific step
export const getPrepChanges = (stepName?: string) => {
  if (stepName) {
    return datasetCache.prepChanges[stepName];
  }
  return datasetCache.prepChanges;
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
    metadata: null,
    originalRows: [],
    originalVariables: [],
    prepChanges: {},
    isRealData: false
  };
  localStorage.removeItem('datasetMetadata');
  localStorage.removeItem('currentDatasetState');
};

// Restore dataset state from localStorage (for persistence across page loads)
export const restoreDatasetState = () => {
  try {
    const savedState = localStorage.getItem('currentDatasetState');
    if (savedState) {
      const { variables, prepChanges, metadata } = JSON.parse(savedState);
      if (variables && Array.isArray(variables)) {
        datasetCache.variables = variables;
        datasetCache.prepChanges = prepChanges || {};
        if (metadata) {
          datasetCache.metadata = metadata;
        }
        console.log('Restored dataset state from localStorage:', {
          variables: variables.length,
          prepChanges: Object.keys(prepChanges || {}),
          totalRows: metadata?.totalRows
        });
        return true;
      }
    }
  } catch (e) {
    console.warn('Could not restore dataset state:', e);
  }
  return false;
};

// FIXED: Initialize sample data cache - only if no real data exists
export const initializeSampleDataCache = (sampleData: any) => {
  // CRITICAL: Don't override real data with sample data
  if (datasetCache.isRealData && datasetCache.allRows.length > 0) {
    console.log('Skipping sample data initialization - real data already loaded');
    return;
  }
  
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
    }, false); // Mark as sample data
  }
};

// Get current dataset info for debugging
export const getDatasetInfo = () => {
  return {
    totalRows: datasetCache.allRows.length,
    totalVariables: datasetCache.variables.length,
    isRealData: datasetCache.isRealData,
    hasOriginal: datasetCache.originalRows.length > 0,
    prepSteps: Object.keys(datasetCache.prepChanges)
  };
};

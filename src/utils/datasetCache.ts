
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
  sessionId: string; // Add session tracking
  locked: boolean; // Add locking mechanism
}

// Single source of truth for dataset
let datasetCache: DatasetCache = {
  allRows: [],
  variables: [],
  metadata: null,
  originalRows: [],
  originalVariables: [],
  prepChanges: {},
  isRealData: false,
  sessionId: '',
  locked: false
};

// Generate unique session ID for tracking
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// CRITICAL: Dataset logging function for debugging - NOW EXPORTED
export const logDatasetState = (context: string, additionalInfo?: any) => {
  const state = {
    context,
    sessionId: datasetCache.sessionId,
    rowCount: datasetCache.allRows.length,
    originalRowCount: datasetCache.originalRows.length,
    variableCount: datasetCache.variables.length,
    isRealData: datasetCache.isRealData,
    locked: datasetCache.locked,
    fileName: datasetCache.metadata?.fileName || 'Unknown',
    cacheSource: datasetCache.isRealData ? 'REAL_DATA_CACHE' : 'SAMPLE_DATA_CACHE',
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
  
  console.log(`🔍 DATASET STATE [${context}]:`, state);
  
  // Also log to a global array for debugging
  if (!(window as any).datasetLogs) {
    (window as any).datasetLogs = [];
  }
  (window as any).datasetLogs.push(state);
  
  return state;
};

// Store the complete dataset in memory
export const setDatasetCache = (rows: any[], variables: DataVariable[], metadata: any, isRealData: boolean = true) => {
  const sessionId = generateSessionId();
  
  console.log('🚀 SETTING DATASET CACHE:', {
    rows: rows.length,
    variables: variables.length,
    metadata,
    isRealData,
    sessionId
  });
  
  // CRITICAL: If we already have a locked real dataset, prevent override unless explicitly unlocked
  if (datasetCache.locked && datasetCache.isRealData && !isRealData) {
    console.error('🚫 BLOCKED: Attempt to override locked real dataset with sample data');
    logDatasetState('OVERRIDE_BLOCKED', { 
      attemptedRows: rows.length, 
      attemptedIsReal: isRealData 
    });
    return;
  }
  
  datasetCache = {
    allRows: [...rows], // Copy arrays to avoid mutation
    variables: [...variables],
    metadata,
    originalRows: [...rows], // Store original data
    originalVariables: [...variables],
    prepChanges: {}, // Reset prep changes when setting new data
    isRealData,
    sessionId,
    locked: isRealData // Lock when real data is set
  };
  
  logDatasetState('CACHE_SET', {
    newSessionId: sessionId,
    dataLocked: isRealData
  });
  
  // Also store basic info in localStorage for persistence
  try {
    localStorage.setItem('datasetMetadata', JSON.stringify({
      ...metadata,
      isRealData,
      totalRows: rows.length,
      sessionId
    }));
  } catch (e) {
    console.warn('Could not save metadata to localStorage:', e);
  }
};

// Update dataset with modified data (for data prep steps) - ONLY when explicitly called
export const updateDatasetCache = (rows: any[], variables: DataVariable[], stepName?: string, changes?: any) => {
  console.log('🔄 UPDATING DATASET CACHE:', {
    stepName,
    currentRows: datasetCache.allRows.length,
    newRows: rows.length,
    changes,
    wasRealData: datasetCache.isRealData,
    isLocked: datasetCache.locked
  });
  
  // CRITICAL: Only update if we have real data loaded
  if (!datasetCache.isRealData) {
    console.error('🚫 BLOCKED: Cannot update dataset cache - no real data loaded');
    logDatasetState('UPDATE_BLOCKED_NO_REAL_DATA', {
      attemptedStepName: stepName,
      attemptedRows: rows.length
    });
    return;
  }
  
  // CRITICAL: Don't let small datasets override large ones unless explicitly intended
  if (datasetCache.originalRows.length > 1000 && rows.length < 1000 && stepName !== 'removeColumns') {
    console.error('🚫 BLOCKED: Preventing small dataset from overriding large dataset');
    logDatasetState('UPDATE_BLOCKED_SIZE_MISMATCH', {
      originalRows: datasetCache.originalRows.length,
      attemptedRows: rows.length,
      stepName
    });
    return;
  }
  
  // Update the current state but preserve original data
  const previousRowCount = datasetCache.allRows.length;
  datasetCache.allRows = [...rows];
  datasetCache.variables = [...variables];
  
  logDatasetState('CACHE_UPDATED', {
    stepName,
    previousRowCount,
    newRowCount: rows.length,
    rowCountChange: rows.length - previousRowCount
  });
  
  // Store the changes for this step
  if (stepName && changes) {
    datasetCache.prepChanges[stepName] = changes;
    console.log('✅ Stored prep changes for step:', stepName, changes);
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
      totalRows: rows.length,
      sessionId: datasetCache.sessionId
    }));
  } catch (e) {
    console.warn('Could not persist dataset state:', e);
  }
};

// Reset to original data (useful for starting fresh)
export const resetDatasetCache = () => {
  console.log('🔄 RESETTING DATASET CACHE to original data');
  logDatasetState('BEFORE_RESET');
  
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
  
  logDatasetState('AFTER_RESET');
  
  // Clear persisted state
  localStorage.removeItem('currentDatasetState');
};

// Get dataset variables (always return current state)
export const getDatasetVariables = (): DataVariable[] => {
  logDatasetState('GET_VARIABLES');
  return [...datasetCache.variables]; // Return copy to prevent mutation
};

// Get paginated rows
export const getDatasetRows = (page: number = 0, rowsPerPage: number = 10): any[] => {
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  logDatasetState('GET_PAGINATED_ROWS', {
    page,
    rowsPerPage,
    startIndex,
    endIndex,
    totalAvailable: datasetCache.allRows.length
  });
  
  return datasetCache.allRows.slice(startIndex, endIndex);
};

// Get preview rows (first 5)
export const getDatasetPreviewRows = (): any[] => {
  logDatasetState('GET_PREVIEW_ROWS');
  return datasetCache.allRows.slice(0, 5);
};

// Get all rows (for processing) - CRITICAL: Return complete dataset
export const getAllDatasetRows = (): any[] => {
  logDatasetState('GET_ALL_ROWS', {
    returningRows: datasetCache.allRows.length,
    originalRows: datasetCache.originalRows.length
  });
  
  // CRITICAL: Always return the current dataset state (including any applied changes)
  return [...datasetCache.allRows]; // Return copy to prevent mutation
};

// Get total row count
export const getDatasetRowCount = (): number => {
  const count = datasetCache.allRows.length;
  logDatasetState('GET_ROW_COUNT', { count });
  return count;
};

// Get dataset metadata
export const getDatasetMetadata = () => {
  logDatasetState('GET_METADATA');
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
  const loaded = datasetCache.allRows.length > 0 && datasetCache.variables.length > 0 && datasetCache.isRealData;
  logDatasetState('CHECK_LOADED', { loaded });
  return loaded;
};

// Clear the cache
export const clearDatasetCache = () => {
  console.log('🗑️ CLEARING DATASET CACHE');
  logDatasetState('BEFORE_CLEAR');
  
  datasetCache = {
    allRows: [],
    variables: [],
    metadata: null,
    originalRows: [],
    originalVariables: [],
    prepChanges: {},
    isRealData: false,
    sessionId: '',
    locked: false
  };
  
  localStorage.removeItem('datasetMetadata');
  localStorage.removeItem('currentDatasetState');
  
  logDatasetState('AFTER_CLEAR');
};

// Manually unlock dataset (for admin/debug purposes)
export const unlockDatasetCache = () => {
  console.log('🔓 UNLOCKING DATASET CACHE');
  datasetCache.locked = false;
  logDatasetState('CACHE_UNLOCKED');
};

// Restore dataset state from localStorage (for persistence across page loads)
export const restoreDatasetState = () => {
  try {
    const savedState = localStorage.getItem('currentDatasetState');
    if (savedState) {
      const { variables, prepChanges, metadata, sessionId } = JSON.parse(savedState);
      if (variables && Array.isArray(variables)) {
        datasetCache.variables = variables;
        datasetCache.prepChanges = prepChanges || {};
        datasetCache.sessionId = sessionId || generateSessionId();
        if (metadata) {
          datasetCache.metadata = metadata;
        }
        logDatasetState('STATE_RESTORED', {
          variables: variables.length,
          prepChanges: Object.keys(prepChanges || {}),
          totalRows: metadata?.totalRows,
          restoredSessionId: sessionId
        });
        return true;
      }
    }
  } catch (e) {
    console.warn('Could not restore dataset state:', e);
  }
  return false;
};

// FIXED: Initialize sample data cache - ONLY if no real data exists and explicitly called
export const initializeSampleDataCache = (sampleData: any) => {
  // CRITICAL: NEVER override real data with sample data
  if (datasetCache.isRealData && datasetCache.allRows.length > 0) {
    console.error('🚫 BLOCKED: Sample data initialization - real data already loaded');
    logDatasetState('SAMPLE_INIT_BLOCKED_REAL_DATA', {
      realDataRows: datasetCache.allRows.length
    });
    return;
  }
  
  // Only initialize if cache is completely empty OR not locked
  if (datasetCache.allRows.length > 0 || datasetCache.locked) {
    console.error('🚫 BLOCKED: Sample data initialization - cache has data or is locked');
    logDatasetState('SAMPLE_INIT_BLOCKED_CACHE_NOT_EMPTY', {
      currentRows: datasetCache.allRows.length,
      locked: datasetCache.locked
    });
    return;
  }
  
  if (sampleData?.variables && sampleData?.previewRows) {
    console.log('📝 INITIALIZING SAMPLE DATA CACHE (cache was empty)');
    
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
    
    logDatasetState('SAMPLE_DATA_INITIALIZED', {
      generatedRows: extendedRows.length
    });
  }
};

// Get current dataset info for debugging
export const getDatasetInfo = () => {
  const info = {
    totalRows: datasetCache.allRows.length,
    totalVariables: datasetCache.variables.length,
    isRealData: datasetCache.isRealData,
    hasOriginal: datasetCache.originalRows.length > 0,
    prepSteps: Object.keys(datasetCache.prepChanges),
    originalRows: datasetCache.originalRows.length,
    sessionId: datasetCache.sessionId,
    locked: datasetCache.locked,
    fileName: datasetCache.metadata?.fileName || 'Unknown'
  };
  
  logDatasetState('GET_DATASET_INFO', info);
  return info;
};

// Get all dataset logs for debugging
export const getDatasetLogs = () => {
  return (window as any).datasetLogs || [];
};

// Clear dataset logs
export const clearDatasetLogs = () => {
  (window as any).datasetLogs = [];
  console.log('🗑️ Dataset logs cleared');
};

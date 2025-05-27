
import { DataVariable } from '@/services/sampleDataService';

interface DatasetCache {
  allRows: any[];
  variables: DataVariable[];
  metadata: {
    fileName: string;
    totalRows: number;
    totalColumns: number;
    uploadedAt: string;
    projectId?: string; // Add project ID for isolation
  } | null;
  originalRows: any[];
  originalVariables: DataVariable[];
  prepChanges: {
    [stepName: string]: any;
  };
  projectId: string | null; // Track which project this cache belongs to
}

// Single source of truth for dataset
let datasetCache: DatasetCache = {
  allRows: [],
  variables: [],
  metadata: null,
  originalRows: [],
  originalVariables: [],
  prepChanges: {},
  projectId: null
};

// Helper function to get current project ID
const getCurrentProjectId = (): string | null => {
  try {
    const currentProject = localStorage.getItem('currentProject');
    const currentFile = localStorage.getItem('currentFile');
    
    if (currentProject) {
      const project = JSON.parse(currentProject);
      return project.id;
    }
    
    if (currentFile) {
      const file = JSON.parse(currentFile);
      return file.projectId || file.name; // Fallback to filename if no project ID
    }
    
    return null;
  } catch (e) {
    console.warn('Error getting current project ID:', e);
    return null;
  }
};

// Check if cache belongs to current project
const isCacheValidForCurrentProject = (): boolean => {
  const currentProjectId = getCurrentProjectId();
  return currentProjectId !== null && datasetCache.projectId === currentProjectId;
};

// Store the complete dataset in memory
export const setDatasetCache = (rows: any[], variables: DataVariable[], metadata: any) => {
  const currentProjectId = getCurrentProjectId();
  
  console.log('Setting dataset cache for project:', currentProjectId, {
    rows: rows.length,
    variables: variables.length,
    metadata
  });
  
  datasetCache = {
    allRows: [...rows],
    variables: [...variables],
    metadata: { ...metadata, projectId: currentProjectId },
    originalRows: [...rows],
    originalVariables: [...variables],
    prepChanges: {},
    projectId: currentProjectId
  };
  
  // Store basic info in localStorage with project isolation
  try {
    const storageKey = `datasetMetadata_${currentProjectId}`;
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  } catch (e) {
    console.warn('Could not save metadata to localStorage:', e);
  }
};

// Update dataset with modified data (for data prep steps)
export const updateDatasetCache = (rows: any[], variables: DataVariable[], stepName?: string, changes?: any) => {
  const currentProjectId = getCurrentProjectId();
  
  // Ensure we're updating the correct project's cache
  if (!isCacheValidForCurrentProject()) {
    console.warn('Cache project mismatch, clearing cache');
    clearDatasetCache();
    return;
  }
  
  console.log('Updating dataset cache for project:', currentProjectId, {
    rows: rows.length,
    variables: variables.length,
    stepName,
    changes
  });
  
  datasetCache.allRows = [...rows];
  datasetCache.variables = [...variables];
  
  if (stepName && changes) {
    datasetCache.prepChanges[stepName] = changes;
  }
  
  if (datasetCache.metadata) {
    datasetCache.metadata = {
      ...datasetCache.metadata,
      totalRows: rows.length,
      totalColumns: variables.length
    };
  }
  
  // Persist with project isolation
  try {
    const storageKey = `currentDatasetState_${currentProjectId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      variables: datasetCache.variables,
      prepChanges: datasetCache.prepChanges,
      metadata: datasetCache.metadata
    }));
  } catch (e) {
    console.warn('Could not persist dataset state:', e);
  }
};

// Reset to original data
export const resetDatasetCache = () => {
  if (!isCacheValidForCurrentProject()) {
    console.warn('Cache project mismatch, clearing cache');
    clearDatasetCache();
    return;
  }
  
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
  
  // Clear persisted state for current project
  const currentProjectId = getCurrentProjectId();
  if (currentProjectId) {
    localStorage.removeItem(`currentDatasetState_${currentProjectId}`);
  }
};

// Get dataset variables with project validation
export const getDatasetVariables = (): DataVariable[] => {
  if (!isCacheValidForCurrentProject()) {
    console.log('Cache invalid for current project, returning empty array');
    return [];
  }
  return [...datasetCache.variables];
};

// Get paginated rows with project validation
export const getDatasetRows = (page: number = 0, rowsPerPage: number = 10): any[] => {
  if (!isCacheValidForCurrentProject()) {
    console.log('Cache invalid for current project, returning empty array');
    return [];
  }
  
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  return datasetCache.allRows.slice(startIndex, endIndex);
};

// Get preview rows with project validation
export const getDatasetPreviewRows = (): any[] => {
  if (!isCacheValidForCurrentProject()) {
    return [];
  }
  return datasetCache.allRows.slice(0, 5);
};

// Get all rows with project validation
export const getAllDatasetRows = (): any[] => {
  if (!isCacheValidForCurrentProject()) {
    return [];
  }
  return [...datasetCache.allRows];
};

// Get total row count with project validation
export const getDatasetRowCount = (): number => {
  if (!isCacheValidForCurrentProject()) {
    return 0;
  }
  return datasetCache.allRows.length;
};

// Get dataset metadata with project validation
export const getDatasetMetadata = () => {
  if (!isCacheValidForCurrentProject()) {
    return null;
  }
  return datasetCache.metadata;
};

// Get preparation changes with project validation
export const getPrepChanges = (stepName?: string) => {
  if (!isCacheValidForCurrentProject()) {
    return stepName ? undefined : {};
  }
  
  if (stepName) {
    return datasetCache.prepChanges[stepName];
  }
  return datasetCache.prepChanges;
};

// Check if dataset is loaded and valid for current project
export const isDatasetLoaded = (): boolean => {
  return isCacheValidForCurrentProject() && 
         datasetCache.allRows.length > 0 && 
         datasetCache.variables.length > 0;
};

// Clear the cache completely
export const clearDatasetCache = () => {
  const oldProjectId = datasetCache.projectId;
  console.log('Clearing dataset cache for project:', oldProjectId);
  
  datasetCache = {
    allRows: [],
    variables: [],
    metadata: null,
    originalRows: [],
    originalVariables: [],
    prepChanges: {},
    projectId: null
  };
  
  // Clear all project-specific localStorage items
  if (oldProjectId) {
    localStorage.removeItem(`datasetMetadata_${oldProjectId}`);
    localStorage.removeItem(`currentDatasetState_${oldProjectId}`);
  }
  
  // Also clear legacy items
  localStorage.removeItem('datasetMetadata');
  localStorage.removeItem('currentDatasetState');
};

// Clear cache for a specific project
export const clearProjectCache = (projectId: string) => {
  console.log('Clearing cache for specific project:', projectId);
  
  // If it's the current project's cache, clear it
  if (datasetCache.projectId === projectId) {
    clearDatasetCache();
  }
  
  // Clear localStorage items for this project
  localStorage.removeItem(`datasetMetadata_${projectId}`);
  localStorage.removeItem(`currentDatasetState_${projectId}`);
  localStorage.removeItem(`reportItems_${projectId}`);
  localStorage.removeItem(`completedPrepSteps_${projectId}`);
  localStorage.removeItem(`preparedVariables_${projectId}`);
  localStorage.removeItem(`preparedDataRows_${projectId}`);
};

// Restore dataset state from localStorage with project isolation
export const restoreDatasetState = () => {
  const currentProjectId = getCurrentProjectId();
  if (!currentProjectId) {
    console.log('No current project ID, cannot restore state');
    return false;
  }
  
  try {
    const storageKey = `currentDatasetState_${currentProjectId}`;
    const savedState = localStorage.getItem(storageKey);
    
    if (savedState) {
      const { variables, prepChanges, metadata } = JSON.parse(savedState);
      if (variables && Array.isArray(variables)) {
        // Only restore if the cache is empty or belongs to a different project
        if (!isDatasetLoaded() || datasetCache.projectId !== currentProjectId) {
          datasetCache.variables = variables;
          datasetCache.prepChanges = prepChanges || {};
          datasetCache.projectId = currentProjectId;
          if (metadata) {
            datasetCache.metadata = metadata;
          }
          
          console.log('Restored dataset state for project:', currentProjectId, {
            variables: variables.length,
            prepChanges: Object.keys(prepChanges || {})
          });
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Could not restore dataset state:', e);
  }
  return false;
};

// Initialize cache from sample data with project isolation
export const initializeSampleDataCache = (sampleData: any) => {
  if (sampleData?.variables && sampleData?.previewRows) {
    const currentProjectId = getCurrentProjectId();
    
    // Generate extended rows for sample data
    const extendedRows = [];
    const baseRows = sampleData.previewRows;
    const totalToGenerate = 100;
    
    for (let i = 0; i < totalToGenerate; i++) {
      const baseRow = baseRows[i % baseRows.length];
      const modifiedRow = { ...baseRow };
      
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
      uploadedAt: new Date().toISOString(),
      projectId: currentProjectId
    });
  }
};

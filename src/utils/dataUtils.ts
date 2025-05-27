import { sampleDatasets, getSampleDataset, DataVariable } from '../services/sampleDataService';
import { parseExcelFile, ExcelParseResult } from './excelUtils';
import { 
  setDatasetCache, 
  updateDatasetCache,
  getDatasetVariables as getCachedVariables,
  getDatasetRows as getCachedRows,
  getDatasetPreviewRows as getCachedPreviewRows,
  getAllDatasetRows as getCachedAllRows,
  getDatasetRowCount,
  getDatasetMetadata,
  getPrepChanges,
  isDatasetLoaded,
  clearDatasetCache,
  restoreDatasetState,
  initializeSampleDataCache
} from './datasetCache';

// Helper function to check if a value is numeric
const isNumeric = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(Number(value)) && isFinite(Number(value));
};

// Enhanced variable analysis with improved numeric detection
const analyzeVariable = (header: string, values: any[]): DataVariable => {
  const nonEmptyValues = values.filter(v => v !== null && v !== '' && v !== undefined);
  const uniqueValues = [...new Set(nonEmptyValues)];
  const missingCount = values.length - nonEmptyValues.length;
  
  // Check numeric percentage
  const numericValues = nonEmptyValues.filter(v => isNumeric(v));
  const numericPercentage = nonEmptyValues.length > 0 ? (numericValues.length / nonEmptyValues.length) * 100 : 0;
  
  let type: 'text' | 'categorical' | 'numeric' | 'date' = 'text';
  let invalidValues: string[] = [];
  
  // Enhanced numeric detection: if 90% or more values are numeric, treat as numeric
  if (numericPercentage >= 90 && nonEmptyValues.length > 0) {
    type = 'numeric';
    // Collect non-numeric values as invalid
    invalidValues = nonEmptyValues
      .filter(v => !isNumeric(v))
      .map(v => String(v))
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates
      .slice(0, 10); // Limit to first 10 unique invalid values
  } else if (uniqueValues.length <= 10 && nonEmptyValues.length > uniqueValues.length * 2) {
    type = 'categorical';
  } else if (nonEmptyValues.some(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
    type = 'date';
  }

  const coding: { [key: string]: number } = {};
  if (type === 'categorical') {
    uniqueValues.forEach((value, index) => {
      coding[String(value)] = index;
    });
  }
  
  const result: DataVariable = {
    name: header,
    type,
    missing: missingCount,
    unique: uniqueValues.length,
    example: nonEmptyValues[0] ? String(nonEmptyValues[0]) : 'N/A',
    coding: type === 'categorical' ? coding : undefined,
    originalCategories: type === 'categorical' ? uniqueValues.map(v => String(v)) : undefined
  };

  // Add numeric-specific properties if it's a numeric column with invalid values
  if (type === 'numeric' && invalidValues.length > 0) {
    result.invalidValues = invalidValues;
    result.numericPercentage = numericPercentage;
  }

  return result;
};

// Helper function to check if in demo mode
export const isDemoMode = () => {
  return localStorage.getItem('isDemoMode') === 'true';
};

// Helper function to check if current file is sample data
export const isSampleData = () => {
  return localStorage.getItem('isSampleData') === 'true';
};

// Get current file information
export const getCurrentFile = () => {
  const fileData = localStorage.getItem('currentFile');
  if (!fileData) return null;
  
  return JSON.parse(fileData);
};

// Get current project information (returns null in demo mode)
export const getCurrentProject = () => {
  if (isDemoMode()) return null;
  
  const projectData = localStorage.getItem('currentProject');
  if (!projectData) return null;
  
  return JSON.parse(projectData);
};

// Save project information (disabled in demo mode)
export const saveProject = (projectInfo: any) => {
  if (isDemoMode()) return;
  
  localStorage.setItem('currentProject', JSON.stringify(projectInfo));
  
  // Also save to past projects list immediately
  saveProjectToPastProjects(projectInfo);
};

// Save project to past projects list (disabled in demo mode)
export const saveProjectToPastProjects = (project: any) => {
  if (isDemoMode()) return;
  
  const pastProjects = getPastProjects();
  
  // Check if project already exists (by id)
  const existingIndex = pastProjects.findIndex(p => p.id === project.id);
  
  if (existingIndex >= 0) {
    // Update existing project
    pastProjects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    // Add new project
    pastProjects.push({ ...project, updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem('pastProjects', JSON.stringify(pastProjects));
};

// Get past projects (returns empty array in demo mode)
export const getPastProjects = () => {
  if (isDemoMode()) return [];
  
  const savedProjects = localStorage.getItem('pastProjects');
  return savedProjects ? JSON.parse(savedProjects) : [];
};

// Create a new project with file data (disabled in demo mode)
export const createProject = (projectName: string, fileData: any, processedData?: any) => {
  if (isDemoMode()) return null;
  
  const project = {
    id: Date.now().toString(),
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fileData,
    processedData: processedData || {}
  };
  
  // Clear any existing data first
  clearAllProjectData();
  
  // Save as current project and to past projects
  saveProject(project);
  
  return project;
};

// Enhanced project deletion with complete cleanup
export const deleteProject = (projectId: string) => {
  console.log('Deleting project:', projectId);
  
  // Clear all project-specific data
  clearAllProjectData(projectId);
  
  // Remove from past projects list
  const pastProjects = getPastProjects();
  const updatedProjects = pastProjects.filter(p => p.id !== projectId);
  localStorage.setItem('pastProjects', JSON.stringify(updatedProjects));
  
  // If it's the current project, clear current project data
  const currentProject = getCurrentProject();
  if (currentProject && currentProject.id === projectId) {
    localStorage.removeItem('currentProject');
    localStorage.removeItem('currentFile');
    localStorage.removeItem('processedData');
    localStorage.removeItem('isSampleData');
  }
};

// Switch to a different project with complete isolation
export const switchToProject = (project: any) => {
  console.log('Switching to project:', project.id);
  
  // Clear current project data first
  const currentProject = getCurrentProject();
  if (currentProject && currentProject.id !== project.id) {
    clearAllProjectData(currentProject.id);
  }
  
  // Set new project as current
  localStorage.setItem('currentProject', JSON.stringify(project));
  if (project.fileData) {
    localStorage.setItem('currentFile', JSON.stringify(project.fileData));
    localStorage.setItem('processedData', JSON.stringify(project.processedData || {}));
    localStorage.setItem('isSampleData', project.fileData.id ? 'true' : 'false');
  }
  
  // Clear the dataset cache to force reload
  clearDatasetCache();
};

// Save preparation step completion with project isolation
export const saveStepCompletion = (step: string, completed: boolean) => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `completedPrepSteps_${projectId}`;
  const currentSteps = getCompletedSteps();
  currentSteps[step] = completed;
  localStorage.setItem(storageKey, JSON.stringify(currentSteps));
};

// Get preparation steps with project isolation
export const getCompletedSteps = () => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `completedPrepSteps_${projectId}`;
  const stepsData = localStorage.getItem(storageKey);
  if (!stepsData) {
    return {
      missingValues: false,
      recodeVariables: false,
      compositeScores: false,
      standardizeVariables: false,
      removeColumns: false,
      fixDuplicates: false
    };
  }
  
  return JSON.parse(stepsData);
};

// Save prepared variables with project isolation
export const savePreparedVariables = (variables: DataVariable[]) => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `preparedVariables_${projectId}`;
  localStorage.setItem(storageKey, JSON.stringify(variables));
};

// Get prepared variables with project isolation
export const getPreparedVariables = () => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `preparedVariables_${projectId}`;
  const variablesData = localStorage.getItem(storageKey);
  if (!variablesData) return null;
  
  return JSON.parse(variablesData);
};

// Save prepared data rows with project isolation
export const savePreparedDataRows = (rows: any[]) => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `preparedDataRows_${projectId}`;
  localStorage.setItem(storageKey, JSON.stringify(rows));
};

// Get prepared data rows with project isolation
export const getPreparedDataRows = () => {
  const currentProject = getCurrentProject();
  const projectId = currentProject?.id || 'default';
  
  const storageKey = `preparedDataRows_${projectId}`;
  const rowsData = localStorage.getItem(storageKey);
  if (!rowsData) return null;
  
  return JSON.parse(rowsData);
};

// Enhanced project isolation functions
export const clearAllProjectData = (projectId?: string) => {
  const targetProjectId = projectId || getCurrentProject()?.id;
  
  if (targetProjectId) {
    console.log('Clearing all data for project:', targetProjectId);
    
    // Clear project-specific cache
    clearProjectCache(targetProjectId);
    
    // Clear project-specific localStorage items
    localStorage.removeItem(`reportItems_${targetProjectId}`);
    localStorage.removeItem(`completedPrepSteps_${targetProjectId}`);
    localStorage.removeItem(`preparedVariables_${targetProjectId}`);
    localStorage.removeItem(`preparedDataRows_${targetProjectId}`);
    localStorage.removeItem(`analysisResult_${targetProjectId}`);
    
    // Clear visualization state
    localStorage.removeItem(`visualizationState_${targetProjectId}`);
    localStorage.removeItem(`chartConfigs_${targetProjectId}`);
  }
  
  // Also clear legacy global items to be safe
  localStorage.removeItem('reportItems');
  localStorage.removeItem('completedPrepSteps');
  localStorage.removeItem('preparedVariables');
  localStorage.removeItem('preparedDataRows');
  localStorage.removeItem('analysisResult');
  localStorage.removeItem('visualizationState');
  localStorage.removeItem('chartConfigs');
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

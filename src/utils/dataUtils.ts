import { sampleDatasets, getSampleDataset, DataVariable } from '../services/sampleDataService';
import { parseExcelFile, ExcelParseResult } from './excelUtils';
import { 
  setDatasetCache, 
  getDatasetVariables as getCachedVariables,
  getDatasetRows as getCachedRows,
  getDatasetPreviewRows as getCachedPreviewRows,
  getDatasetRowCount,
  getDatasetMetadata,
  isDatasetLoaded,
  clearDatasetCache,
  initializeSampleDataCache
} from './datasetCache';

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
  
  // Save as current project and to past projects
  saveProject(project);
  
  return project;
};

// Update project name (disabled in demo mode)
export const updateProjectName = (newName: string) => {
  if (isDemoMode()) return;
  
  const project = getCurrentProject();
  if (project) {
    project.name = newName;
    project.updatedAt = new Date().toISOString();
    saveProject(project);
  }
};

// Update project with new data (disabled in demo mode)
export const updateProject = (updates: any) => {
  if (isDemoMode()) return null;
  
  const project = getCurrentProject();
  if (project) {
    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    saveProject(updatedProject);
    return updatedProject;
  }
  return null;
};

// Clear demo mode data
export const clearDemoMode = () => {
  localStorage.removeItem('isDemoMode');
  localStorage.removeItem('isSampleData');
  localStorage.removeItem('currentFile');
  localStorage.removeItem('processedData');
  localStorage.removeItem('completedPrepSteps');
  localStorage.removeItem('preparedVariables');
};

// Save preparation step completion status
export const saveStepCompletion = (step: string, completed: boolean) => {
  const currentSteps = getCompletedSteps();
  currentSteps[step] = completed;
  localStorage.setItem('completedPrepSteps', JSON.stringify(currentSteps));
};

// Get preparation step completion statuses
export const getCompletedSteps = () => {
  const stepsData = localStorage.getItem('completedPrepSteps');
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

// Enhanced process file data with unified cache storage
export const processFileData = async (file: File, selectedSheet?: string): Promise<{ variables: DataVariable[], previewRows: any[], totalRows: number }> => {
  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  if (!isCSV && !isExcel) {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
  
  console.log('Processing file:', fileName, 'Size:', file.size);
  
  let result: { variables: DataVariable[], previewRows: any[], totalRows: number };
  
  if (isExcel) {
    const excelResult = await parseExcelFile(file, selectedSheet);
    result = {
      variables: excelResult.variables,
      previewRows: excelResult.previewRows,
      totalRows: excelResult.totalRows
    };
  } else {
    result = await processCSVDataOptimized(file);
  }
  
  // Store complete dataset in unified cache
  const metadata = {
    fileName: file.name,
    totalRows: result.totalRows,
    totalColumns: result.variables.length,
    uploadedAt: new Date().toISOString()
  };
  
  // For CSV, we need to get all rows, not just preview
  if (isCSV) {
    const allRows = await getAllCSVRows(file);
    setDatasetCache(allRows, result.variables, metadata);
  } else {
    // For Excel, parseExcelFile already returns all rows in previewRows
    setDatasetCache(excelResult.previewRows, result.variables, metadata);
  }
  
  console.log('Dataset cached successfully:', {
    totalRows: result.totalRows,
    variables: result.variables.length
  });
  
  return result;
};

// Helper function to get all CSV rows (not just preview)
const getAllCSVRows = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        // Parse header
        const headers = parseCSVLine(lines[0]);
        
        // Process all rows
        const allRows = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
              const value = values[index] || null;
              row[header] = value === '' ? null : value;
            });
            allRows.push(row);
          } catch (lineError) {
            console.warn(`Error parsing line ${i}:`, lineError);
          }
        }
        
        resolve(allRows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Helper function to properly parse CSV lines with quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"|"$/g, ''));
};

// Optimized CSV processing with simplified storage
export const processCSVDataOptimized = async (file: File): Promise<{ variables: DataVariable[], previewRows: any[], totalRows: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        // Parse header
        const headers = parseCSVLine(lines[0]);
        console.log('CSV headers found:', headers.length);
        
        // Process all rows
        const allRows = [];
        
        console.log('Processing', lines.length - 1, 'data rows');
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
              const value = values[index] || null;
              row[header] = value === '' ? null : value;
            });
            allRows.push(row);
          } catch (lineError) {
            console.warn(`Error parsing line ${i}:`, lineError);
          }
        }
        
        console.log('Successfully processed', allRows.length, 'rows');
        
        // Analyze variables based on sample
        const sampleSize = Math.min(1000, allRows.length);
        const sampleRows = allRows.slice(0, sampleSize);
        
        const variables: DataVariable[] = headers.map(header => {
          const values = sampleRows.map(row => row[header]).filter(v => v !== null && v !== '');
          const uniqueValues = [...new Set(values)];
          const missingCount = sampleRows.length - values.length;
          
          // Determine variable type
          let type: 'text' | 'categorical' | 'numeric' | 'date' = 'text';
          
          // Check if numeric
          const numericValues = values.filter(v => !isNaN(Number(v)) && v !== '');
          if (numericValues.length === values.length && values.length > 0) {
            type = 'numeric';
          } else if (uniqueValues.length <= 10 && values.length > uniqueValues.length * 2) {
            type = 'categorical';
          } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
            type = 'date';
          }

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
        
        const previewRows = allRows.slice(0, 5);
        
        resolve({
          variables,
          previewRows,
          totalRows: allRows.length
        });
      } catch (error) {
        console.error('Error processing CSV:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Simplified functions using the new cache system
export const getDatasetVariables = () => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) return [];
  
  // Check if using sample data
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData) {
      // Initialize cache with sample data if not already done
      if (!isDatasetLoaded()) {
        initializeSampleDataCache(sampleData);
      }
    }
  }
  
  return getCachedVariables();
};

export const getDatasetPreviewRows = () => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) return [];
  
  // Check if using sample data
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData) {
      // Initialize cache with sample data if not already done
      if (!isDatasetLoaded()) {
        initializeSampleDataCache(sampleData);
      }
    }
  }
  
  return getCachedPreviewRows();
};

// Simplified function for pagination - single source of truth
export const getFullDatasetRows = async (page: number = 0, rowsPerPage: number = 10): Promise<any[]> => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('getFullDatasetRows: No file info found');
    return [];
  }
  
  console.log(`getFullDatasetRows: page ${page}, rowsPerPage ${rowsPerPage}`);
  
  // Check if using sample data
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData && !isDatasetLoaded()) {
      console.log('Initializing sample data cache');
      initializeSampleDataCache(sampleData);
    }
  }
  
  // Always get from cache - single source of truth
  const rows = getCachedRows(page, rowsPerPage);
  console.log(`Returning ${rows.length} rows from cache`);
  return rows;
};

// Save prepared variables data
export const savePreparedVariables = (variables: DataVariable[]) => {
  localStorage.setItem('preparedVariables', JSON.stringify(variables));
};

// Get prepared variables
export const getPreparedVariables = () => {
  const variablesData = localStorage.getItem('preparedVariables');
  if (!variablesData) return null;
  
  return JSON.parse(variablesData);
};

// Save prepared data rows
export const savePreparedDataRows = (rows: any[]) => {
  localStorage.setItem('preparedDataRows', JSON.stringify(rows));
};

// Get prepared data rows
export const getPreparedDataRows = () => {
  const rowsData = localStorage.getItem('preparedDataRows');
  if (!rowsData) return null;
  
  return JSON.parse(rowsData);
};

// Get the most recent dataset state (for visualization and analysis)
export const getCurrentDatasetState = () => {
  const variables = getDatasetVariables();
  const previewRows = getDatasetPreviewRows();
  const completedSteps = getCompletedSteps();
  
  return {
    variables,
    previewRows,
    completedSteps,
    hasBeenPrepared: Object.values(completedSteps).some(step => step === true)
  };
};

// Check if dataset has been modified during preparation
export const hasDatasetBeenModified = () => {
  const completedSteps = getCompletedSteps();
  return Object.values(completedSteps).some(step => step === true);
};

// Apply data preparation changes (simulated for demo)
export const applyDataPrepChanges = (stepType: string, changes: any) => {
  const currentVars = getDatasetVariables();
  const currentRows = getDatasetPreviewRows();
  
  // Simulate applying changes based on step type
  let updatedVars = [...currentVars];
  let updatedRows = [...currentRows];
  
  console.log(`Applying data prep changes for ${stepType}:`, changes);
  
  switch (stepType) {
    case 'missingValues':
      // Mark that missing values have been handled
      updatedVars = updatedVars.map(v => ({ ...v, missing: 0 }));
      break;
      
    case 'recodeVariables':
      // Update variable types and names if recoded, but preserve original categories
      if (changes.recodedVariables) {
        changes.recodedVariables.forEach((recode: any) => {
          const varIndex = updatedVars.findIndex(v => v.name === recode.originalName);
          if (varIndex >= 0) {
            const originalVar = updatedVars[varIndex];
            updatedVars[varIndex] = {
              ...originalVar,
              name: recode.newName || recode.originalName,
              type: recode.newType || originalVar.type,
              // Preserve original categories and update coding if provided
              coding: recode.newCoding || originalVar.coding,
              originalCategories: originalVar.originalCategories || originalVar.coding ? Object.keys(originalVar.coding) : undefined
            };
          }
        });
      }
      break;
      
    case 'removeColumns':
      // Remove specified columns
      if (changes.removedColumns) {
        updatedVars = updatedVars.filter(v => !changes.removedColumns.includes(v.name));
        updatedRows = updatedRows.map(row => {
          const newRow = { ...row };
          changes.removedColumns.forEach((col: string) => {
            delete newRow[col];
          });
          return newRow;
        });
      }
      break;
      
    case 'standardizeVariables':
      // Update variable names if standardized
      console.log('Applying variable standardization:', changes);
      if (changes.standardizedNames) {
        changes.standardizedNames.forEach((change: any) => {
          const varIndex = updatedVars.findIndex(v => v.name === change.oldName);
          if (varIndex >= 0) {
            console.log(`Updating variable name from "${change.oldName}" to "${change.newName}"`);
            updatedVars[varIndex] = {
              ...updatedVars[varIndex],
              name: change.newName
            };
            
            // Also update the row data keys
            updatedRows = updatedRows.map(row => {
              if (row.hasOwnProperty(change.oldName)) {
                const newRow = { ...row };
                newRow[change.newName] = newRow[change.oldName];
                delete newRow[change.oldName];
                return newRow;
              }
              return row;
            });
          }
        });
      }
      break;
  }
  
  console.log('Updated variables after data prep:', updatedVars.map(v => ({ name: v.name, type: v.type })));
  
  // Save the updated state
  savePreparedVariables(updatedVars);
  savePreparedDataRows(updatedRows);
  
  return { variables: updatedVars, previewRows: updatedRows };
};

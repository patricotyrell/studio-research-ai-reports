import { sampleDatasets, getSampleDataset, DataVariable } from '../services/sampleDataService';
import { parseExcelFile, ExcelParseResult } from './excelUtils';

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

// Cache for loaded data chunks to avoid re-parsing
const dataCache = new Map<string, any[]>();
const loadingPromises = new Map<string, Promise<any[]>>();

// Clear cache when file changes
const clearCacheForFile = () => {
  dataCache.clear();
  loadingPromises.clear();
};

// Enhanced process file data to handle both CSV and Excel files with memory optimization
export const processFileData = async (file: File, selectedSheet?: string): Promise<{ variables: DataVariable[], previewRows: any[], totalRows: number }> => {
  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  if (!isCSV && !isExcel) {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
  
  // Clear any existing cache
  clearCacheForFile();
  
  if (isExcel) {
    const result = await parseExcelFile(file, selectedSheet);
    // Store file reference for chunked loading
    const fileUrl = URL.createObjectURL(file);
    sessionStorage.setItem('uploadedFileUrl', fileUrl);
    sessionStorage.setItem('uploadedFileName', file.name);
    sessionStorage.setItem('uploadedFileType', 'excel');
    if (selectedSheet) {
      sessionStorage.setItem('selectedSheet', selectedSheet);
    }
    return result;
  }
  
  // Handle CSV files with memory optimization
  return processCSVDataOptimized(file);
};

// Optimized CSV processing that doesn't store all rows in memory
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
        
        // Process only a sample of rows for analysis (first 1000 rows)
        const sampleSize = Math.min(1000, lines.length - 1);
        const sampleRows = [];
        
        for (let i = 1; i <= sampleSize; i++) {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          headers.forEach((header, index) => {
            const value = values[index] || null;
            row[header] = value === '' ? null : value;
          });
          sampleRows.push(row);
        }
        
        console.log('Processing CSV data optimized - sample rows:', sampleRows.length);
        console.log('Total file rows:', lines.length - 1);
        
        // Analyze variables based on sample
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
        
        // Store the file for later access
        const fileUrl = URL.createObjectURL(file);
        sessionStorage.setItem('uploadedFileUrl', fileUrl);
        sessionStorage.setItem('uploadedFileName', file.name);
        sessionStorage.setItem('uploadedFileType', 'csv');
        
        const previewRows = sampleRows.slice(0, 5);
        const totalRows = lines.length - 1;
        
        resolve({
          variables,
          previewRows,
          totalRows
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

// Helper function to properly parse CSV lines with quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
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

// Get variables for the current dataset (real or sample)
export const getDatasetVariables = () => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) return [];
  
  // First try to get prepared variables (post data-prep)
  const preparedVars = getPreparedVariables();
  if (preparedVars && preparedVars.length > 0) {
    return preparedVars;
  }
  
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    return sampleData?.variables || [];
  }
  
  // For real uploaded files, get from processed data
  const processedData = localStorage.getItem('processedData');
  if (processedData) {
    const data = JSON.parse(processedData);
    return data.variables || [];
  }
  
  return [];
};

// Get preview rows for the current dataset
export const getDatasetPreviewRows = () => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) return [];
  
  // First try to get prepared data rows (post data-prep)
  const preparedData = getPreparedDataRows();
  if (preparedData && preparedData.length > 0) {
    return preparedData.slice(0, 5);
  }
  
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    return sampleData?.previewRows || [];
  }
  
  // For real uploaded files, get from processed data
  const processedData = localStorage.getItem('processedData');
  if (processedData) {
    const data = JSON.parse(processedData);
    return data.previewRows || [];
  }
  
  return [];
};

// Enhanced function to load data chunks on demand with better caching and error handling
export const loadDataChunk = async (startRow: number, rowCount: number): Promise<any[]> => {
  const cacheKey = `${startRow}-${rowCount}`;
  
  // Check cache first
  if (dataCache.has(cacheKey)) {
    console.log(`Returning cached data for chunk ${cacheKey}`);
    return dataCache.get(cacheKey)!;
  }
  
  // Check if there's already a loading promise for this chunk
  if (loadingPromises.has(cacheKey)) {
    console.log(`Waiting for existing promise for chunk ${cacheKey}`);
    return await loadingPromises.get(cacheKey)!;
  }
  
  const fileUrl = sessionStorage.getItem('uploadedFileUrl');
  const fileName = sessionStorage.getItem('uploadedFileName');
  const fileType = sessionStorage.getItem('uploadedFileType');
  
  if (!fileUrl || !fileName) {
    console.log('No file URL found, returning empty array');
    return [];
  }
  
  // Create and store the loading promise
  const loadingPromise = (async () => {
    try {
      console.log(`Loading data chunk: rows ${startRow} to ${startRow + rowCount}`);
      
      if (fileType === 'excel') {
        // For Excel files, we need to handle differently
        console.log('Excel chunked loading not fully implemented yet, returning empty array');
        return [];
      }
      
      // For CSV files
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        console.log('File has insufficient data');
        return [];
      }
      
      const headers = parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);
      
      const startIndex = Math.max(0, startRow);
      const endIndex = Math.min(dataLines.length, startRow + rowCount);
      
      console.log(`Processing lines ${startIndex} to ${endIndex} of ${dataLines.length} total data lines`);
      
      const rows = [];
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const values = parseCSVLine(dataLines[i]);
          const row: any = {};
          headers.forEach((header, index) => {
            const value = values[index] || null;
            row[header] = value === '' ? null : value;
          });
          rows.push(row);
        } catch (lineError) {
          console.warn(`Error parsing line ${i + 1}:`, lineError);
          // Continue with other lines
        }
      }
      
      // Cache the result
      dataCache.set(cacheKey, rows);
      
      console.log(`Successfully loaded chunk: rows ${startIndex} to ${endIndex}, count: ${rows.length}`);
      return rows;
    } catch (error) {
      console.error('Error loading data chunk:', error);
      throw error; // Re-throw to be handled by the calling function
    } finally {
      // Remove the promise from the map when done
      loadingPromises.delete(cacheKey);
    }
  })();
  
  // Store the promise
  loadingPromises.set(cacheKey, loadingPromise);
  
  return await loadingPromise;
};

// Updated function to get full dataset rows for pagination with better error handling
export const getFullDatasetRows = async (page: number = 0, rowsPerPage: number = 10): Promise<any[]> => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('getFullDatasetRows: No file info found');
    return [];
  }
  
  console.log(`getFullDatasetRows called with page: ${page}, rowsPerPage: ${rowsPerPage}`);
  console.log('File info:', { name: fileInfo.name, rows: fileInfo.rows, columns: fileInfo.columns });
  
  // First try to get prepared data rows (post data-prep)
  const preparedData = getPreparedDataRows();
  if (preparedData && preparedData.length > 0) {
    console.log('getFullDatasetRows: Using prepared data, total rows:', preparedData.length);
    const startIndex = page * rowsPerPage;
    return preparedData.slice(startIndex, startIndex + rowsPerPage);
  }
  
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    const baseRows = sampleData?.previewRows || [];
    if (baseRows.length > 0) {
      // Generate additional sample rows for demonstration
      const extendedRows = [];
      for (let i = 0; i < Math.min(100, fileInfo.rows || 50); i++) {
        const baseRow = baseRows[i % baseRows.length];
        const modifiedRow = { ...baseRow };
        
        Object.keys(modifiedRow).forEach(key => {
          if (modifiedRow[key] && typeof modifiedRow[key] === 'string') {
            if (key.toLowerCase().includes('id') || key.toLowerCase().includes('name')) {
              modifiedRow[key] = `${modifiedRow[key]}_${i + 1}`;
            }
          }
        });
        
        extendedRows.push(modifiedRow);
      }
      console.log('getFullDatasetRows: Using sample data, generated rows:', extendedRows.length);
      const startIndex = page * rowsPerPage;
      return extendedRows.slice(startIndex, startIndex + rowsPerPage);
    }
    return baseRows;
  }
  
  // For uploaded files, load data on demand with better error handling
  try {
    const startRow = page * rowsPerPage;
    console.log(`Loading chunk starting at row ${startRow} for page ${page}`);
    const rows = await loadDataChunk(startRow, rowsPerPage);
    
    if (rows.length === 0 && page === 0) {
      // If first page has no data, there might be an issue
      console.warn('First page returned no data - potential parsing issue');
    }
    
    return rows;
  } catch (error) {
    console.error('Error in getFullDatasetRows:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
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

// Clear data cache when needed (export this for external use)
export const clearDataCache = () => {
  dataCache.clear();
  loadingPromises.clear();
  console.log('Data cache cleared');
};

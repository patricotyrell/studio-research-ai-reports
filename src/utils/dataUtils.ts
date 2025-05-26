
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

// In-memory storage for large datasets
let inMemoryDataset: any = null;

// Enhanced process file data with memory-efficient storage
export const processFileData = async (file: File, selectedSheet?: string): Promise<{ variables: DataVariable[], previewRows: any[], totalRows: number }> => {
  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  if (!isCSV && !isExcel) {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
  
  console.log('Processing file:', fileName, 'Size:', file.size);
  
  if (isExcel) {
    const result = await parseExcelFile(file, selectedSheet);
    
    // Store data efficiently
    inMemoryDataset = {
      variables: result.variables,
      allRows: result.previewRows, // This contains all parsed rows
      totalRows: result.totalRows,
      fileType: 'excel'
    };
    
    // Only store essential metadata in localStorage
    try {
      localStorage.setItem('datasetMeta', JSON.stringify({
        hasData: true,
        totalRows: result.totalRows,
        variables: result.variables,
        fileType: 'excel'
      }));
    } catch (e) {
      console.warn('Could not save metadata to localStorage:', e);
    }
    
    return result;
  }
  
  // Handle CSV files
  return processCSVDataOptimized(file);
};

// Optimized CSV processing with memory-efficient storage
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
        
        // Process data in chunks to avoid memory issues
        const allRows = [];
        const totalDataLines = lines.length - 1;
        const chunkSize = 1000;
        
        console.log('Processing', totalDataLines, 'data rows in chunks');
        
        // Process all rows but limit what we store in localStorage
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
        
        // Store full dataset in memory
        inMemoryDataset = {
          variables: null, // Will be set below
          allRows,
          totalRows: allRows.length,
          fileType: 'csv',
          headers
        };
        
        // Analyze variables based on sample (first 1000 rows)
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
        
        // Update in-memory dataset with variables
        inMemoryDataset.variables = variables;
        
        // Only store essential metadata in localStorage
        try {
          localStorage.setItem('datasetMeta', JSON.stringify({
            hasData: true,
            totalRows: allRows.length,
            variables: variables,
            fileType: 'csv'
          }));
        } catch (e) {
          console.warn('Could not save metadata to localStorage:', e);
        }
        
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
  
  // Try to get from in-memory dataset first
  if (inMemoryDataset?.variables) {
    return inMemoryDataset.variables;
  }
  
  // Fallback to metadata in localStorage
  try {
    const metadata = localStorage.getItem('datasetMeta');
    if (metadata) {
      const data = JSON.parse(metadata);
      return data.variables || [];
    }
  } catch (e) {
    console.warn('Error reading dataset metadata:', e);
  }
  
  // Final fallback to processedData
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
  
  // Try in-memory dataset first
  if (inMemoryDataset?.allRows) {
    return inMemoryDataset.allRows.slice(0, 5);
  }
  
  // For real uploaded files, get from processed data
  const processedData = localStorage.getItem('processedData');
  if (processedData) {
    const data = JSON.parse(processedData);
    return data.previewRows || [];
  }
  
  return [];
};

// Optimized function to get full dataset rows for pagination
export const getFullDatasetRows = async (page: number = 0, rowsPerPage: number = 10): Promise<any[]> => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('getFullDatasetRows: No file info found');
    return [];
  }
  
  console.log(`getFullDatasetRows: page ${page}, rowsPerPage ${rowsPerPage}, total rows: ${fileInfo.rows}`);
  
  // First try prepared data (post data-prep)
  const preparedData = getPreparedDataRows();
  if (preparedData && preparedData.length > 0) {
    console.log('Using prepared data, total rows:', preparedData.length);
    const startIndex = page * rowsPerPage;
    return preparedData.slice(startIndex, startIndex + rowsPerPage);
  }
  
  // Handle sample data
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    const baseRows = sampleData?.previewRows || [];
    if (baseRows.length > 0) {
      console.log('Using sample data, generating extended rows');
      // Generate extended sample data for demonstration
      const extendedRows = [];
      const totalToGenerate = Math.min(1000, fileInfo.rows || 100);
      
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
      
      const startIndex = page * rowsPerPage;
      return extendedRows.slice(startIndex, startIndex + rowsPerPage);
    }
  }
  
  // Use in-memory dataset for real uploaded files
  if (inMemoryDataset?.allRows) {
    console.log(`Loading from in-memory dataset: ${inMemoryDataset.allRows.length} total rows`);
    
    const startIndex = page * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, inMemoryDataset.allRows.length);
    const pageRows = inMemoryDataset.allRows.slice(startIndex, endIndex);
    
    console.log(`Returning rows ${startIndex} to ${endIndex}: ${pageRows.length} rows`);
    return pageRows;
  }
  
  console.log('No data source found');
  return [];
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

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
  initializeSampleDataCache,
  getDatasetInfo as getCachedDatasetInfo
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
  
  console.log('🚀 PROCESSING FILE:', fileName, 'Size:', file.size);
  
  let result: { variables: DataVariable[], previewRows: any[], totalRows: number };
  
  if (isExcel) {
    const excelResult = await parseExcelFile(file, selectedSheet);
    result = {
      variables: excelResult.variables,
      previewRows: excelResult.previewRows,
      totalRows: excelResult.totalRows
    };
    
    // For Excel, parseExcelFile already returns all rows in previewRows
    const metadata = {
      fileName: file.name,
      totalRows: excelResult.totalRows,
      totalColumns: excelResult.variables.length,
      uploadedAt: new Date().toISOString()
    };
    
    console.log('📊 Setting Excel dataset in cache:', {
      rows: excelResult.previewRows.length,
      variables: excelResult.variables.length,
      totalRows: excelResult.totalRows
    });
    
    setDatasetCache(excelResult.previewRows, excelResult.variables, metadata);
  } else {
    // For CSV, get all rows and store in cache
    const allRows = await getAllCSVRows(file);
    const csvResult = await processCSVDataOptimized(file);
    
    const metadata = {
      fileName: file.name,
      totalRows: allRows.length,
      totalColumns: csvResult.variables.length,
      uploadedAt: new Date().toISOString()
    };
    
    console.log('📊 Setting CSV dataset in cache:', {
      rows: allRows.length,
      variables: csvResult.variables.length
    });
    
    setDatasetCache(allRows, csvResult.variables, metadata);
    
    result = {
      variables: csvResult.variables,
      previewRows: allRows.slice(0, 5),
      totalRows: allRows.length
    };
  }
  
  console.log('✅ Dataset cached successfully:', {
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

// Enhanced CSV processing with improved type detection
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
        
        // Analyze variables using enhanced logic
        const sampleSize = Math.min(1000, allRows.length);
        const sampleRows = allRows.slice(0, sampleSize);
        
        const variables: DataVariable[] = headers.map(header => {
          const values = sampleRows.map(row => row[header]);
          return analyzeVariable(header, values);
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

// CRITICAL: Enhanced data access functions with logging
export const getDatasetVariables = () => {
  console.log('🔍 GETTING DATASET VARIABLES');
  
  // CRITICAL: Always use cached data first if available and real
  if (isDatasetLoaded()) {
    console.log('✅ Using cached variables (real data)');
    return getCachedVariables();
  }
  
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('❌ No file info found');
    return [];
  }
  
  // ONLY use sample data if no real data is cached AND we're explicitly in sample mode
  if (isSampleData() && fileInfo.id && !isDatasetLoaded()) {
    console.log('📝 Loading sample data variables (no real data in cache)');
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData) {
      initializeSampleDataCache(sampleData);
      return getCachedVariables();
    }
  }
  
  const variables = getCachedVariables();
  console.log('📊 Returning variables:', variables.length);
  return variables;
};

export const getDatasetPreviewRows = () => {
  console.log('🔍 GETTING DATASET PREVIEW ROWS');
  
  // CRITICAL: Always use cached data first if available and real
  if (isDatasetLoaded()) {
    console.log('✅ Using cached preview rows (real data)');
    return getCachedPreviewRows();
  }
  
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('❌ No file info found for preview');
    return [];
  }
  
  // ONLY use sample data if no real data is cached AND we're explicitly in sample mode
  if (isSampleData() && fileInfo.id && !isDatasetLoaded()) {
    console.log('📝 Loading sample preview rows (no real data in cache)');
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData) {
      initializeSampleDataCache(sampleData);
      return getCachedPreviewRows();
    }
  }
  
  const previewRows = getCachedPreviewRows();
  console.log('📊 Returning preview rows:', previewRows.length);
  return previewRows;
};

// CRITICAL: Always return complete dataset from cache - never allow sample override
export const getFullDatasetRows = async (page: number = 0, rowsPerPage: number = 10): Promise<any[]> => {
  console.log(`🔍 GETTING FULL DATASET ROWS: page ${page}, rowsPerPage ${rowsPerPage}`);
  
  // ALWAYS use cached data if available (real data has priority)
  if (isDatasetLoaded()) {
    const allRows = getCachedAllRows();
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRows = allRows.slice(startIndex, endIndex);
    
    console.log(`✅ Returning ${paginatedRows.length} rows from REAL DATA cache (${startIndex}-${endIndex} of ${allRows.length})`);
    return paginatedRows;
  }
  
  // Fallback to sample data ONLY if no real data exists
  const fileInfo = getCurrentFile();
  if (!fileInfo) {
    console.log('❌ getFullDatasetRows: No file info found');
    return [];
  }
  
  if (isSampleData() && fileInfo.id) {
    console.log('📝 Using sample data as fallback (no real data available)');
    const sampleData = getSampleDataset(fileInfo.id);
    if (sampleData) {
      initializeSampleDataCache(sampleData);
      const allRows = getCachedAllRows();
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const rows = allRows.slice(startIndex, endIndex);
      console.log(`📊 Returning ${rows.length} sample rows`);
      return rows;
    }
  }
  
  console.log('❌ No data available');
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
  console.log('🔍 GETTING CURRENT DATASET STATE');
  
  // Try to restore state from localStorage first
  restoreDatasetState();
  
  const variables = getCachedVariables();
  const previewRows = getCachedPreviewRows();
  const completedSteps = getCompletedSteps();
  const prepChanges = getPrepChanges();
  const datasetInfo = getCachedDatasetInfo();
  
  const state = {
    variables,
    previewRows,
    completedSteps,
    prepChanges,
    hasBeenPrepared: Object.keys(prepChanges).length > 0,
    totalRows: datasetInfo.totalRows,
    sessionId: datasetInfo.sessionId,
    isRealData: datasetInfo.isRealData,
    fileName: datasetInfo.fileName
  };
  
  console.log('📊 Current dataset state:', state);
  return state;
};

// CRITICAL: Always return the complete current dataset (including all prep changes)
export const getDatasetForAnalysis = () => {
  console.log('🔍 GETTING DATASET FOR ANALYSIS');
  
  // Always use the current state from cache (which includes all prep changes)
  const variables = getCachedVariables();
  const allRows = getCachedAllRows();
  const metadata = getDatasetMetadata();
  const prepChanges = getPrepChanges();
  const datasetInfo = getCachedDatasetInfo();
  
  const result = {
    variables,
    rows: allRows,
    metadata,
    prepChanges,
    sessionId: datasetInfo.sessionId,
    isRealData: datasetInfo.isRealData
  };
  
  console.log('📊 Dataset for analysis:', {
    variables: result.variables.length,
    rows: result.rows.length,
    prepChanges: Object.keys(result.prepChanges),
    sessionId: result.sessionId,
    isRealData: result.isRealData
  });
  
  return result;
};

// Check if dataset has been modified during preparation
export const hasDatasetBeenModified = () => {
  const completedSteps = getCompletedSteps();
  return Object.values(completedSteps).some(step => step === true);
};

// FIXED: Apply data preparation changes with enhanced logging
export const applyDataPrepChanges = (stepType: string, changes: any) => {
  console.log(`🔄 APPLYING DATA PREP CHANGES for ${stepType}:`, changes);
  
  // Get current state from cache
  const currentVars = getCachedVariables();
  const currentRows = getCachedAllRows();
  const beforeInfo = getCachedDatasetInfo();
  
  console.log(`📊 Dataset before applying ${stepType}:`, {
    variables: currentVars.length,
    rows: currentRows.length,
    sessionId: beforeInfo.sessionId
  });
  
  // Apply changes based on step type
  let updatedVars = [...currentVars];
  let updatedRows = [...currentRows];
  
  switch (stepType) {
    case 'missingValues':
      console.log('🔧 Applying missing values handling');
      // ... keep existing code (missing values handling) the same
      updatedVars = updatedVars.map(v => {
        let updatedVar = { ...v };
        
        // Handle mixed numeric columns with invalid values
        if (v.type === 'numeric' && v.invalidValues && changes.invalidValueHandling) {
          const handling = changes.invalidValueHandling[v.name];
          console.log(`Handling invalid values for ${v.name} with strategy: ${handling}`);
          
          if (handling === 'null') {
            updatedVar = { 
              ...v, 
              missing: (v.missing || 0) + (v.invalidValues?.length || 0), 
              invalidValues: undefined,
              numericPercentage: undefined 
            };
          } else if (handling === 'zero') {
            updatedVar = { 
              ...v, 
              invalidValues: undefined,
              numericPercentage: undefined 
            };
          } else if (handling === 'mean') {
            updatedVar = { 
              ...v, 
              invalidValues: undefined,
              numericPercentage: undefined 
            };
          }
        }
        
        // Handle regular missing values
        if (changes.missingValueHandling && changes.missingValueHandling[v.name]) {
          const missingHandling = changes.missingValueHandling[v.name];
          if (missingHandling !== 'ignore') {
            updatedVar = { ...updatedVar, missing: 0, missingHandling };
          }
        }
        
        return updatedVar;
      });
      
      // Update row data to reflect the changes
      updatedRows = updatedRows.map(row => {
        const newRow = { ...row };
        
        // Apply invalid value handling to rows
        if (changes.invalidValueHandling) {
          Object.entries(changes.invalidValueHandling).forEach(([colName, handling]) => {
            const variable = currentVars.find(v => v.name === colName);
            if (variable && variable.invalidValues && newRow[colName]) {
              const isInvalid = variable.invalidValues.includes(String(newRow[colName]));
              if (isInvalid) {
                if (handling === 'null') {
                  newRow[colName] = null;
                } else if (handling === 'zero') {
                  newRow[colName] = 0;
                } else if (handling === 'mean') {
                  newRow[colName] = 5; // Simplified for demo
                }
              }
            }
          });
        }
        
        return newRow;
      });
      break;
      
    case 'standardizeVariables':
      console.log('🔧 Applying variable standardization');
      // ... keep existing code (standardization logic) the same
      if (changes.standardizedNames) {
        // First update variables
        changes.standardizedNames.forEach((change: any) => {
          const varIndex = updatedVars.findIndex(v => v.name === change.oldName);
          if (varIndex >= 0) {
            console.log(`Updating variable name from "${change.oldName}" to "${change.newName}"`);
            updatedVars[varIndex] = {
              ...updatedVars[varIndex],
              name: change.newName
            };
          }
        });
        
        // Then update row data keys to match new variable names
        updatedRows = updatedRows.map(row => {
          let newRow = { ...row };
          changes.standardizedNames.forEach((change: any) => {
            if (newRow.hasOwnProperty(change.oldName)) {
              newRow[change.newName] = newRow[change.oldName];
              delete newRow[change.oldName];
            }
          });
          return newRow;
        });
        
        // Also handle categorical values standardization
        if (changes.standardizedValues) {
          Object.entries(changes.standardizedValues).forEach(([varName, valueChanges]: [string, any]) => {
            const variable = updatedVars.find(v => v.name === varName);
            if (variable && variable.type === 'categorical') {
              // Update variable coding
              const newCoding: {[key: string]: number} = {};
              Object.entries(valueChanges).forEach(([oldValue, newValue]: [string, any], index) => {
                newCoding[newValue] = index;
              });
              variable.coding = newCoding;
              variable.originalCategories = Object.keys(newCoding);
              
              // Update row data
              updatedRows = updatedRows.map(row => {
                if (row[varName] && valueChanges[row[varName]]) {
                  return { ...row, [varName]: valueChanges[row[varName]] };
                }
                return row;
              });
            }
          });
        }
      }
      break;
      
    case 'fixDuplicates':
      console.log('🔧 Applying duplicate removal and inconsistency fixes');
      
      // FIXED: Only remove duplicates if we have specific row indexes to remove
      if (changes.duplicatesRemoved > 0 && changes.rowIndexesToRemove && Array.isArray(changes.rowIndexesToRemove)) {
        const indexesToRemove = new Set(changes.rowIndexesToRemove);
        console.log(`Removing ${indexesToRemove.size} specific duplicate rows:`, Array.from(indexesToRemove).slice(0, 10));
        
        // Filter out the specific rows that were identified as duplicates
        const originalLength = updatedRows.length;
        updatedRows = updatedRows.filter((_, index) => !indexesToRemove.has(index));
        
        console.log(`📊 Rows after duplicate removal: ${updatedRows.length} (removed ${originalLength - updatedRows.length})`);
      }
      
      // Handle inconsistent values standardization
      if (changes.inconsistentValuesFixed && changes.standardizedValues) {
        Object.entries(changes.standardizedValues).forEach(([varName, valueMapping]: [string, any]) => {
          console.log(`Standardizing values for variable ${varName}:`, valueMapping);
          
          updatedRows = updatedRows.map(row => {
            if (row[varName] && valueMapping[row[varName]]) {
              return { ...row, [varName]: valueMapping[row[varName]] };
            }
            return row;
          });
          
          // Update variable metadata if it's categorical
          const variable = updatedVars.find(v => v.name === varName);
          if (variable && variable.type === 'categorical' && variable.coding) {
            const newCoding: {[key: string]: number} = {};
            const standardizedCategories = [...new Set(Object.values(valueMapping))];
            standardizedCategories.forEach((category, index) => {
              newCoding[String(category)] = index;
            });
            variable.coding = newCoding;
            variable.originalCategories = standardizedCategories.map(c => String(c));
          }
        });
      }
      break;
      
    case 'recodeVariables':
      console.log('🔧 Applying variable recoding');
      // ... keep existing code (recode variables) the same
      if (changes.recodedVariables) {
        changes.recodedVariables.forEach((recode: any) => {
          const varIndex = updatedVars.findIndex(v => v.name === recode.originalName);
          if (varIndex >= 0) {
            const originalVar = updatedVars[varIndex];
            updatedVars[varIndex] = {
              ...originalVar,
              name: recode.newName || recode.originalName,
              type: recode.newType || originalVar.type,
              coding: recode.newCoding || originalVar.coding,
              originalCategories: originalVar.originalCategories || originalVar.coding ? Object.keys(originalVar.coding) : undefined
            };
          }
        });
      }
      break;
      
    case 'removeColumns':
      console.log('🔧 Applying column removal');
      // ... keep existing code (remove columns) the same
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
      
    case 'compositeScores':
      console.log('🔧 Applying composite score creation');
      // ... keep existing code (composite scores) the same
      if (changes.compositeVariables) {
        // Add new composite variables
        changes.compositeVariables.forEach((composite: any) => {
          updatedVars.push({
            name: composite.name,
            type: 'numeric',
            missing: 0,
            unique: composite.uniqueValues || 10,
            example: composite.exampleValue || '5.0'
          });
          
          // Add composite scores to rows (simplified calculation)
          updatedRows = updatedRows.map(row => ({
            ...row,
            [composite.name]: composite.exampleValue || Math.round(Math.random() * 10)
          }));
        });
      }
      break;
      
    default:
      console.warn(`❌ Unknown step type: ${stepType}`);
      break;
  }
  
  const afterInfo = getCachedDatasetInfo();
  console.log(`✅ Applied ${stepType} changes:`, {
    beforeVars: currentVars.length,
    afterVars: updatedVars.length,
    beforeRows: currentRows.length,
    afterRows: updatedRows.length,
    rowsChanged: currentRows.length !== updatedRows.length,
    sessionId: afterInfo.sessionId
  });
  
  // Update the cache with the new state
  updateDatasetCache(updatedRows, updatedVars, stepType, changes);
  
  // Also save to localStorage for persistence
  savePreparedVariables(updatedVars);
  savePreparedDataRows(updatedRows);
  
  return { variables: updatedVars, previewRows: updatedRows.slice(0, 5) };
};

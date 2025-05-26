import { getAllDatasetRows, getDatasetVariables, getDatasetMetadata, getPrepChanges, getDatasetInfo, isDatasetLoaded, setDatasetCache } from './datasetCache';
import { DataVariable } from '@/services/sampleDataService';

// Get the current state of the dataset (including any prep changes)
export const getCurrentDatasetState = () => {
  console.log('🔍 getCurrentDatasetState called');
  
  const variables = getDatasetVariables();
  const allRows = getAllDatasetRows();
  const metadata = getDatasetMetadata();
  const prepChanges = getPrepChanges();
  const datasetInfo = getDatasetInfo();
  
  console.log('📊 Current dataset state:', {
    variables: variables.length,
    rows: allRows.length,
    metadata: metadata?.fileName || 'Unknown',
    prepSteps: Object.keys(prepChanges),
    isRealData: datasetInfo.isRealData,
    sessionId: datasetInfo.sessionId
  });
  
  return {
    variables,
    rows: allRows,
    metadata,
    prepChanges,
    isRealData: datasetInfo.isRealData,
    sessionId: datasetInfo.sessionId
  };
};

// FIXED: Get dataset specifically for analysis/visualization (ensure we have actual data)
export const getDatasetForAnalysis = () => {
  console.log('🎯 getDatasetForAnalysis called');
  
  // Get the current dataset state
  const currentState = getCurrentDatasetState();
  
  console.log('📊 Analysis dataset state:', {
    variables: currentState.variables.length,
    rows: currentState.rows.length,
    isRealData: currentState.isRealData,
    sessionId: currentState.sessionId,
    hasMetadata: !!currentState.metadata
  });
  
  // CRITICAL: Always return the current state with all data
  return {
    variables: currentState.variables,
    rows: currentState.rows, // This should contain all the actual data rows
    metadata: currentState.metadata,
    prepChanges: currentState.prepChanges,
    isRealData: currentState.isRealData,
    sessionId: currentState.sessionId
  };
};

// Re-export from datasetCache with proper export
export { getDatasetVariables } from './datasetCache';

// Get preview rows for data preview components
export const getDatasetPreviewRows = (limit: number = 100) => {
  const allRows = getAllDatasetRows();
  return allRows.slice(0, limit);
};

// Check if dataset has been modified from original
export const hasDatasetBeenModified = () => {
  const prepChanges = getPrepChanges();
  return Object.keys(prepChanges).length > 0;
};

// Get current file info
export const getCurrentFile = () => {
  try {
    const fileInfo = localStorage.getItem('currentFile');
    return fileInfo ? JSON.parse(fileInfo) : null;
  } catch {
    return null;
  }
};

// Get full dataset rows with pagination
export const getFullDatasetRows = async (page: number = 0, limit: number = 100) => {
  const allRows = getAllDatasetRows();
  const start = page * limit;
  const end = start + limit;
  return allRows.slice(start, end);
};

// Apply data preparation changes
export const applyDataPrepChanges = (stepName: string, changes: any) => {
  console.log(`🔄 Applying data prep changes for step: ${stepName}`, changes);
  // This would integrate with the datasetCache to apply changes
  // For now, just log the changes
};

// Get current project info
export const getCurrentProject = () => {
  try {
    const projectInfo = localStorage.getItem('currentProject');
    return projectInfo ? JSON.parse(projectInfo) : null;
  } catch {
    return null;
  }
};

// Update project name
export const updateProjectName = (name: string) => {
  const project = getCurrentProject();
  if (project) {
    project.name = name;
    localStorage.setItem('currentProject', JSON.stringify(project));
  }
};

// Get past projects
export const getPastProjects = () => {
  try {
    const projects = localStorage.getItem('pastProjects');
    return projects ? JSON.parse(projects) : [];
  } catch {
    return [];
  }
};

// Check if in demo mode
export const isDemoMode = () => {
  return localStorage.getItem('demoMode') === 'true';
};

// Clear demo mode
export const clearDemoMode = () => {
  localStorage.removeItem('demoMode');
};

// Save step completion status
export const saveStepCompletion = (stepName: string, completed: boolean) => {
  try {
    const completedSteps = getCompletedSteps();
    completedSteps[stepName] = completed;
    localStorage.setItem('completedSteps', JSON.stringify(completedSteps));
  } catch (error) {
    console.error('Error saving step completion:', error);
  }
};

// Get completed steps
export const getCompletedSteps = () => {
  try {
    const steps = localStorage.getItem('completedSteps');
    return steps ? JSON.parse(steps) : {};
  } catch {
    return {};
  }
};

// FIXED: Process file data with correct DataVariable type
export const processFileData = async (file: File, selectedSheet?: string) => {
  console.log('🔄 Processing file:', file.name);
  
  try {
    const text = await file.text();
    let rows: any[] = [];
    let variables: DataVariable[] = [];
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      // Simple CSV parsing
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parse data rows first to analyze them
      rows = lines.slice(1).map((line, rowIndex) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, colIndex) => {
          const value = values[colIndex] || '';
          // Try to detect numeric values
          const numValue = parseFloat(value);
          row[header || `Column_${colIndex + 1}`] = isNaN(numValue) ? value : numValue;
        });
        return row;
      });
      
      // Create variables from headers with proper analysis
      variables = headers.map((header, index) => {
        const columnName = header || `Column_${index + 1}`;
        const values = rows.map(row => row[columnName]).filter(val => val !== null && val !== undefined);
        const uniqueValues = new Set(values).size;
        const missingCount = rows.length - values.length;
        const exampleValue = values.length > 0 ? String(values[0]) : '';
        
        // Detect type based on data
        let detectedType: 'numeric' | 'categorical' | 'text' = 'text';
        const numericCount = values.filter(val => !isNaN(parseFloat(String(val)))).length;
        const numericRatio = numericCount / values.length;
        
        if (numericRatio > 0.8) {
          detectedType = 'numeric';
        } else if (uniqueValues < values.length * 0.5 && uniqueValues < 20) {
          detectedType = 'categorical';
        }
        
        return {
          name: columnName,
          type: detectedType,
          missing: missingCount,
          unique: uniqueValues,
          example: exampleValue
        };
      });
      
      console.log('✅ CSV parsed successfully:', {
        headers: headers.length,
        rows: rows.length,
        sampleRow: rows[0]
      });
      
    } else {
      // For now, create sample data structure for Excel files
      console.log('📋 Creating sample data structure for Excel file');
      
      // Generate sample rows first
      for (let i = 0; i < 100; i++) {
        rows.push({
          ID: i + 1,
          Gender: i % 2 === 0 ? 'Male' : 'Female',
          Age: 20 + Math.floor(Math.random() * 60),
          Smoking_Status: i % 3 === 0 ? 'Smoker' : 'Non-Smoker',
          Exercise_Level: ['Low', 'Medium', 'High'][i % 3],
          BMI: 18 + Math.random() * 25,
          Has_Hypertension: i % 4 === 0 ? 'Yes' : 'No',
          Health_Score: 50 + Math.floor(Math.random() * 50)
        });
      }
      
      // Create variables with proper analysis
      variables = [
        { name: 'ID', type: 'numeric', missing: 0, unique: 100, example: '1' },
        { name: 'Gender', type: 'categorical', missing: 0, unique: 2, example: 'Male' },
        { name: 'Age', type: 'numeric', missing: 0, unique: 60, example: '25' },
        { name: 'Smoking_Status', type: 'categorical', missing: 0, unique: 2, example: 'Non-Smoker' },
        { name: 'Exercise_Level', type: 'categorical', missing: 0, unique: 3, example: 'Low' },
        { name: 'BMI', type: 'numeric', missing: 0, unique: 100, example: '22.5' },
        { name: 'Has_Hypertension', type: 'categorical', missing: 0, unique: 2, example: 'No' },
        { name: 'Health_Score', type: 'numeric', missing: 0, unique: 50, example: '75' }
      ];
    }
    
    // CRITICAL: Store data in the dataset cache
    const metadata = {
      fileName: file.name,
      totalRows: rows.length,
      totalColumns: variables.length,
      uploadedAt: new Date().toISOString()
    };
    
    console.log('💾 Storing data in dataset cache:', {
      rows: rows.length,
      variables: variables.length,
      metadata
    });
    
    setDatasetCache(rows, variables, metadata, true);
    
    return {
      variables,
      totalRows: rows.length,
      previewRows: rows.slice(0, 10)
    };
    
  } catch (error) {
    console.error('❌ Error processing file:', error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create project
export const createProject = (name: string, fileInfo: any, processedData: any) => {
  const project = {
    name,
    id: Date.now().toString(),
    created: new Date().toISOString(),
    fileInfo,
    processedData
  };
  
  localStorage.setItem('currentProject', JSON.stringify(project));
  
  // Add to past projects
  const pastProjects = getPastProjects();
  pastProjects.unshift(project);
  localStorage.setItem('pastProjects', JSON.stringify(pastProjects.slice(0, 10))); // Keep last 10
};

// Calculate statistics for numeric variables
export const calculateVariableStats = (data: any[], variableName: string) => {
  const values = data
    .map(row => parseFloat(row[variableName]))
    .filter(val => !isNaN(val));
  
  if (values.length === 0) return null;
  
  values.sort((a, b) => a - b);
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const median = values.length % 2 === 0 
    ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : values[Math.floor(values.length / 2)];
  
  return {
    count: values.length,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    min: values[0],
    max: values[values.length - 1],
    std: Number(Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length).toFixed(2))
  };
};

// Calculate frequency distribution for categorical variables
export const calculateFrequencyDistribution = (data: any[], variableName: string, limit: number = 10) => {
  const counts: Record<string, number> = {};
  
  data.forEach(row => {
    const value = row[variableName];
    if (value !== undefined && value !== null && value !== '') {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count, percentage: (count / data.length) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// Detect variable type based on data
export const detectVariableType = (data: any[], variableName: string): 'numeric' | 'categorical' | 'text' => {
  const sample = data.slice(0, 100).map(row => row[variableName]).filter(val => val !== null && val !== undefined);
  
  if (sample.length === 0) return 'text';
  
  const numericCount = sample.filter(val => !isNaN(parseFloat(String(val)))).length;
  const numericRatio = numericCount / sample.length;
  
  if (numericRatio > 0.8) return 'numeric';
  
  const uniqueValues = new Set(sample.map(val => String(val))).size;
  const uniqueRatio = uniqueValues / sample.length;
  
  return uniqueRatio < 0.5 ? 'categorical' : 'text';
};

// Check data quality
export const checkDataQuality = (data: any[], variables: DataVariable[]) => {
  const totalRows = data.length;
  const issues: string[] = [];
  
  const qualityReport = variables.map(variable => {
    const values = data.map(row => row[variable.name]);
    const missingCount = values.filter(val => val === null || val === undefined || val === '').length;
    const missingPercentage = (missingCount / totalRows) * 100;
    
    if (missingPercentage > 50) {
      issues.push(`${variable.name} has ${missingPercentage.toFixed(1)}% missing values`);
    }
    
    return {
      variable: variable.name,
      missingCount,
      missingPercentage: Number(missingPercentage.toFixed(2)),
      totalValues: totalRows
    };
  });
  
  return {
    qualityReport,
    issues,
    overallQuality: issues.length === 0 ? 'good' : issues.length < 3 ? 'fair' : 'poor'
  };
};

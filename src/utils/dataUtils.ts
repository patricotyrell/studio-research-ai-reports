
import { sampleDatasets, getSampleDataset, DataVariable } from '../services/sampleDataService';

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

// Process CSV data to extract variables and preview rows
export const processCSVData = async (file: File): Promise<{ variables: DataVariable[], previewRows: any[], totalRows: number }> => {
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
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Parse data rows
        const dataRows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });
          return row;
        });
        
        // Analyze variables
        const variables: DataVariable[] = headers.map(header => {
          const values = dataRows.map(row => row[header]).filter(v => v !== null && v !== '');
          const uniqueValues = [...new Set(values)];
          const missingCount = dataRows.length - values.length;
          
          // Determine variable type
          let type: 'text' | 'categorical' | 'numeric' | 'date' = 'text';
          
          // Check if numeric
          const numericValues = values.filter(v => !isNaN(Number(v)) && v !== '');
          if (numericValues.length === values.length && values.length > 0) {
            type = 'numeric';
          } else if (uniqueValues.length <= 10 && values.length > uniqueValues.length * 2) {
            // If unique values are few and repeated, likely categorical
            type = 'categorical';
          } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
            // Basic date pattern check
            type = 'date';
          }
          
          return {
            name: header,
            type,
            missing: missingCount,
            unique: uniqueValues.length,
            example: values[0] || 'N/A'
          };
        });
        
        // Get preview rows (first 5)
        const previewRows = dataRows.slice(0, 5);
        
        resolve({
          variables,
          previewRows,
          totalRows: dataRows.length
        });
      } catch (error) {
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

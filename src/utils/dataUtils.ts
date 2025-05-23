
import { sampleDatasets, getSampleDataset } from '../services/sampleDataService';

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

// Get variables for the current dataset (real or sample)
export const getDatasetVariables = () => {
  const fileInfo = getCurrentFile();
  if (!fileInfo) return [];
  
  if (isSampleData() && fileInfo.id) {
    const sampleData = getSampleDataset(fileInfo.id);
    return sampleData?.variables || [];
  }
  
  // In a real app, we would retrieve variables from the server
  // For now, return empty array if not sample data
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
  
  // In a real app, we would retrieve preview from the server
  return [];
};

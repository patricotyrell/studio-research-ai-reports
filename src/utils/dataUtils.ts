
import { getAllDatasetRows, getDatasetVariables, getDatasetMetadata, getPrepChanges, getDatasetInfo, isDatasetLoaded } from './datasetCache';
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

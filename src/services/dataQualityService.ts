
import { DataVariable } from './sampleDataService';

export interface DataQualityIssue {
  id: string;
  type: 'missing' | 'duplicates' | 'inconsistent' | 'outliers' | 'constant' | 'high_cardinality' | 'format';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestion: string;
  affectedColumn?: string;
  count?: number;
  percentage?: number;
  examples?: string[];
}

export interface DataQualityReport {
  issues: DataQualityIssue[];
  overallScore: number; // 0-100
  summary: string;
}

// Analyze data quality based on variables and preview data
export const analyzeDataQuality = (variables: DataVariable[], previewRows: any[]): DataQualityReport => {
  const issues: DataQualityIssue[] = [];
  
  if (!variables.length || !previewRows.length) {
    return {
      issues: [],
      overallScore: 100,
      summary: "No data available for quality analysis."
    };
  }

  // 1. Missing Data Analysis
  variables.forEach(variable => {
    if (variable.missing > 0) {
      const totalRows = previewRows.length + variable.missing;
      const missingPercentage = (variable.missing / totalRows) * 100;
      
      if (missingPercentage > 20) {
        issues.push({
          id: `missing-${variable.name}`,
          type: 'missing',
          severity: 'high',
          title: `High Missing Values in '${variable.name}'`,
          description: `${variable.missing} missing values (${missingPercentage.toFixed(1)}%)`,
          suggestion: "Consider imputing values or removing this column if too sparse.",
          affectedColumn: variable.name,
          count: variable.missing,
          percentage: missingPercentage
        });
      } else if (missingPercentage > 5) {
        issues.push({
          id: `missing-${variable.name}`,
          type: 'missing',
          severity: 'medium',
          title: `Missing Values in '${variable.name}'`,
          description: `${variable.missing} missing values (${missingPercentage.toFixed(1)}%)`,
          suggestion: "Consider handling missing values in Data Preparation.",
          affectedColumn: variable.name,
          count: variable.missing,
          percentage: missingPercentage
        });
      }
    }
  });

  // 2. Duplicates Analysis (simplified for demo)
  const duplicateCount = Math.floor(previewRows.length * 0.02); // Simulate 2% duplicates
  if (duplicateCount > 0) {
    issues.push({
      id: 'duplicates',
      type: 'duplicates',
      severity: duplicateCount > previewRows.length * 0.05 ? 'high' : 'medium',
      title: 'Duplicate Rows Detected',
      description: `${duplicateCount} duplicate rows found in your dataset`,
      suggestion: "Review and remove duplicate entries in Data Preparation.",
      count: duplicateCount
    });
  }

  // 3. Inconsistent Categorical Values
  variables.filter(v => v.type === 'categorical').forEach(variable => {
    // Simulate inconsistent values based on variable characteristics
    if (variable.name.toLowerCase().includes('gender') || variable.name.toLowerCase().includes('status')) {
      const inconsistentExamples = getInconsistentExamples(variable.name);
      if (inconsistentExamples.length > 0) {
        issues.push({
          id: `inconsistent-${variable.name}`,
          type: 'inconsistent',
          severity: 'medium',
          title: `Inconsistent Values in '${variable.name}'`,
          description: `Found variations in categorical responses`,
          suggestion: "Standardize these values to ensure consistent analysis.",
          affectedColumn: variable.name,
          examples: inconsistentExamples
        });
      }
    }
  });

  // 4. Outliers in Numeric Data
  variables.filter(v => v.type === 'numeric').forEach(variable => {
    // Simulate outlier detection
    if (variable.name.toLowerCase().includes('income') || variable.name.toLowerCase().includes('salary')) {
      const outlierCount = Math.floor(previewRows.length * 0.03);
      if (outlierCount > 0) {
        issues.push({
          id: `outliers-${variable.name}`,
          type: 'outliers',
          severity: 'low',
          title: `Outliers Detected in '${variable.name}'`,
          description: `${outlierCount} potential outliers found`,
          suggestion: "Review extreme values - they may be data entry errors or genuine edge cases.",
          affectedColumn: variable.name,
          count: outlierCount
        });
      }
    }
  });

  // 5. Constant or Near-Constant Columns
  variables.forEach(variable => {
    const constantThreshold = 0.95;
    const dominantValueRatio = (previewRows.length - variable.unique + 1) / previewRows.length;
    
    if (dominantValueRatio > constantThreshold) {
      issues.push({
        id: `constant-${variable.name}`,
        type: 'constant',
        severity: 'medium',
        title: `Low Variance in '${variable.name}'`,
        description: `${(dominantValueRatio * 100).toFixed(1)}% of values are the same`,
        suggestion: "Consider removing this column as it provides little analytical value.",
        affectedColumn: variable.name,
        percentage: dominantValueRatio * 100
      });
    }
  });

  // 6. High Cardinality in Categorical Columns
  variables.filter(v => v.type === 'categorical').forEach(variable => {
    const cardinalityRatio = variable.unique / previewRows.length;
    
    if (cardinalityRatio > 0.8 && variable.unique > 50) {
      issues.push({
        id: `cardinality-${variable.name}`,
        type: 'high_cardinality',
        severity: 'low',
        title: `High Cardinality in '${variable.name}'`,
        description: `${variable.unique} unique values - likely not useful for group analysis`,
        suggestion: "Consider excluding from statistical analysis or grouping similar values.",
        affectedColumn: variable.name,
        count: variable.unique
      });
    }
  });

  // Calculate overall score
  const severityWeights = { high: 20, medium: 10, low: 5 };
  const totalDeduction = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
  const overallScore = Math.max(0, 100 - totalDeduction);

  const summary = generateQualitySummary(issues, overallScore);

  return {
    issues,
    overallScore,
    summary
  };
};

const getInconsistentExamples = (variableName: string): string[] => {
  if (variableName.toLowerCase().includes('gender')) {
    return ['Male', 'male', 'MALE', 'M'];
  }
  if (variableName.toLowerCase().includes('status')) {
    return ['Active', 'active', 'ACTIVE', 'Act'];
  }
  return [];
};

const generateQualitySummary = (issues: DataQualityIssue[], score: number): string => {
  if (score >= 90) {
    return "Excellent data quality with minimal issues detected.";
  } else if (score >= 75) {
    return "Good data quality with some minor issues to address.";
  } else if (score >= 60) {
    return "Moderate data quality - several issues should be resolved.";
  } else {
    return "Poor data quality - significant issues need attention before analysis.";
  }
};

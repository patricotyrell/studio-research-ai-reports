
/**
 * Utility functions for chart type selection based on variable combinations
 */

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';
type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';
type VariableType = 'categorical' | 'numeric' | 'text' | 'date';

interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  isValid: boolean;
  priority: number; // Higher number = higher priority
}

/**
 * Get valid chart types based on variable combinations and exploration mode
 */
export const getValidChartTypes = (
  explorationMode: ExplorationMode,
  primaryType: VariableType,
  secondaryType?: VariableType
): ChartType[] => {
  // Exclude text/freeform variables from current charts
  if (primaryType === 'text' || secondaryType === 'text') {
    return [];
  }

  if (explorationMode === 'distribution') {
    return getDistributionCharts(primaryType);
  } else if (explorationMode === 'relationship') {
    return getRelationshipCharts(primaryType, secondaryType);
  } else if (explorationMode === 'comparison') {
    return getComparisonCharts(primaryType, secondaryType);
  }

  return [];
};

/**
 * Get valid charts for single variable distribution
 */
const getDistributionCharts = (variableType: VariableType): ChartType[] => {
  switch (variableType) {
    case 'categorical':
      return ['pie', 'bar']; // Pie Chart, Bar Chart, Frequency Table
    case 'numeric':
      return ['histogram', 'boxplot']; // Histogram, Box Plot
    case 'date':
      return ['line', 'bar']; // Line Chart for time series, Bar for date groupings
    default:
      return [];
  }
};

/**
 * Get valid charts for relationship between two variables
 */
const getRelationshipCharts = (primaryType: VariableType, secondaryType?: VariableType): ChartType[] => {
  if (!secondaryType) return [];

  // Categorical + Categorical
  if (primaryType === 'categorical' && secondaryType === 'categorical') {
    return ['bar']; // Grouped Bar Chart, Stacked Bar, Crosstab
  }

  // Categorical + Numeric
  if ((primaryType === 'categorical' && secondaryType === 'numeric') ||
      (primaryType === 'numeric' && secondaryType === 'categorical')) {
    return ['bar', 'boxplot']; // Bar Chart (average), Box Plot
  }

  // Numeric + Numeric
  if (primaryType === 'numeric' && secondaryType === 'numeric') {
    return ['scatter', 'line']; // Scatter Plot, Line Chart (if ordered)
  }

  // Date combinations
  if (primaryType === 'date' || secondaryType === 'date') {
    return ['line', 'bar']; // Line Chart for time series
  }

  return [];
};

/**
 * Get valid charts for comparison across groups
 */
const getComparisonCharts = (primaryType: VariableType, secondaryType?: VariableType): ChartType[] => {
  if (!secondaryType) return [];

  // Categorical grouping variable + Numeric measure
  if (primaryType === 'categorical' && secondaryType === 'numeric') {
    return ['bar', 'boxplot']; // Bar Chart (average), Box Plot
  }

  // Categorical + Categorical (cross-tabulation)
  if (primaryType === 'categorical' && secondaryType === 'categorical') {
    return ['bar']; // Grouped Bar Chart for comparison
  }

  return ['bar']; // Default to bar chart for other combinations
};

/**
 * Get recommended chart type based on variable combination
 */
export const getRecommendedChartType = (
  explorationMode: ExplorationMode,
  primaryType: VariableType,
  secondaryType?: VariableType
): ChartType => {
  const validCharts = getValidChartTypes(explorationMode, primaryType, secondaryType);
  
  if (validCharts.length === 0) {
    return 'bar'; // Fallback
  }

  // Return the first (most recommended) chart type
  return validCharts[0];
};

/**
 * Check if table visualization is supported for the given variable combination
 */
export const canShowTable = (
  explorationMode: ExplorationMode,
  primaryType: VariableType,
  secondaryType?: VariableType
): boolean => {
  // Exclude text/freeform variables
  if (primaryType === 'text' || secondaryType === 'text') {
    return false;
  }

  if (explorationMode === 'distribution') {
    return primaryType === 'categorical'; // Frequency Table
  }

  if (explorationMode === 'relationship' || explorationMode === 'comparison') {
    // Crosstab for categorical + categorical
    return primaryType === 'categorical' && secondaryType === 'categorical';
  }

  return false;
};

/**
 * Validate if a chart type is appropriate for the given variable combination
 */
export const isChartTypeValid = (
  chartType: ChartType,
  explorationMode: ExplorationMode,
  primaryType: VariableType,
  secondaryType?: VariableType
): boolean => {
  const validCharts = getValidChartTypes(explorationMode, primaryType, secondaryType);
  return validCharts.includes(chartType);
};

/**
 * Get chart configuration details
 */
export const getChartConfigurations = (): Record<ChartType, ChartConfig> => {
  return {
    'bar': {
      type: 'bar',
      title: 'Bar Chart',
      description: 'Shows categorical distributions or group comparisons',
      isValid: true,
      priority: 8
    },
    'pie': {
      type: 'pie',
      title: 'Pie Chart',
      description: 'Shows proportional distribution of categories',
      isValid: true,
      priority: 7
    },
    'histogram': {
      type: 'histogram',
      title: 'Histogram',
      description: 'Shows distribution of numeric variables in bins',
      isValid: true,
      priority: 9
    },
    'boxplot': {
      type: 'boxplot',
      title: 'Box Plot',
      description: 'Shows distribution statistics and outliers',
      isValid: true,
      priority: 6
    },
    'scatter': {
      type: 'scatter',
      title: 'Scatter Plot',
      description: 'Shows relationship between two numeric variables',
      isValid: true,
      priority: 9
    },
    'line': {
      type: 'line',
      title: 'Line Chart',
      description: 'Shows trends over time or ordered data',
      isValid: true,
      priority: 8
    }
  };
};

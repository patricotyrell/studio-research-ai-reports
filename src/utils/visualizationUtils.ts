
/**
 * Utility functions for data visualization and AI insights generation
 */

type ExplorationMode = 'distribution' | 'relationship' | 'comparison';
type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'boxplot' | 'histogram';

/**
 * Generates AI insights for a chart based on the data and variables
 */
export const generateChartInsights = (
  mode: ExplorationMode,
  chartType: ChartType,
  primaryVariable: string,
  secondaryVariable: string,
  primaryType: string,
  secondaryType: string,
  data: any[]
): string => {
  // In a real implementation, this would use actual statistical analysis
  // For now, we'll use templates based on chart and variable types
  
  if (!data || data.length === 0) {
    return "Insufficient data to generate insights.";
  }
  
  if (mode === 'distribution') {
    if (primaryType === 'categorical') {
      // Find most common category
      let maxValue = 0;
      let maxCategory = '';
      data.forEach(item => {
        if (item.value > maxValue) {
          maxValue = item.value;
          maxCategory = item.name;
        }
      });
      
      // Calculate total to get percentages
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((maxValue / total) * 100).toFixed(1);
      
      return `The distribution of ${primaryVariable} shows that "${maxCategory}" is the most common category, representing approximately ${percentage}% of the data.\n\nThe chart reveals a ${data.length < 4 ? 'limited number of' : 'diverse range of'} categories within ${primaryVariable}. ${data.length > 5 ? 'Consider grouping some of the less frequent categories for clearer visualization.' : ''}`;
    } else {
      // For numeric variables
      return `The histogram shows the distribution of ${primaryVariable}, with values primarily concentrated in the middle ranges.\n\nThe distribution appears to be ${Math.random() > 0.5 ? 'relatively normal' : 'slightly skewed'}. Most values fall within the central bins, suggesting a typical bell curve pattern with some outliers at the extremes.\n\nThis visualization helps identify the central tendency and spread of ${primaryVariable}.`;
    }
  } else if (mode === 'relationship') {
    if (chartType === 'scatter') {
      return `The scatter plot examines the relationship between ${primaryVariable} and ${secondaryVariable}.\n\nVisual inspection suggests a ${Math.random() > 0.6 ? 'moderate positive' : Math.random() > 0.3 ? 'weak negative' : 'minimal'} correlation between these variables. ${Math.random() > 0.5 ? 'There appear to be some outliers in the data that may warrant further investigation.' : 'The data points are fairly evenly distributed across the plot.'}\n\nTo confirm this relationship, consider running a correlation analysis to obtain precise measures of association.`;
    } else {
      return `The chart visualizes the relationship between ${primaryVariable} and ${secondaryVariable}.\n\nThe trend shows ${Math.random() > 0.5 ? 'some notable variations' : 'a relatively consistent pattern'} across different values of ${primaryVariable}. ${Math.random() > 0.7 ? 'There are interesting peaks and valleys that suggest periodic patterns worth investigating further.' : ''}\n\nThis visualization helps to identify patterns and potentially meaningful relationships between these variables.`;
    }
  } else if (mode === 'comparison') {
    // For comparison across groups
    // Find group with highest value
    let maxValue = 0;
    let maxGroup = '';
    let minValue = Infinity;
    let minGroup = '';
    
    data.forEach(item => {
      if (item[secondaryVariable] > maxValue) {
        maxValue = item[secondaryVariable];
        maxGroup = item.name;
      }
      if (item[secondaryVariable] < minValue) {
        minValue = item[secondaryVariable];
        minGroup = item.name;
      }
    });
    
    const difference = ((maxValue - minValue) / ((maxValue + minValue) / 2) * 100).toFixed(1);
    
    return `When comparing ${secondaryVariable} across different ${primaryVariable} groups, "${maxGroup}" shows the highest values while "${minGroup}" shows the lowest.\n\nThe difference between the highest and lowest groups is approximately ${difference}%. This ${Number(difference) > 20 ? 'substantial' : 'modest'} variation suggests that ${primaryVariable} may have a ${Number(difference) > 20 ? 'meaningful' : 'limited'} influence on ${secondaryVariable}.\n\nConsider running an ANOVA or t-test to determine if these differences are statistically significant.`;
  }
  
  return "Chart insights could not be generated with the current data configuration.";
};

/**
 * Calculates frequency distribution table data
 * (In a real implementation, this would perform actual calculations based on data)
 */
export const calculateFrequencyDistribution = (
  data: any[],
  variableName: string,
  variableType: string
): { category: string; frequency: number; percentage: number }[] => {
  // This is a mock implementation - in a real app, this would use actual data
  if (variableType === 'categorical') {
    const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
    const total = 100;
    
    return categories.map(cat => {
      const frequency = Math.floor(Math.random() * 40) + 10;
      return {
        category: cat,
        frequency,
        percentage: (frequency / total) * 100
      };
    });
  } else {
    // For numeric data, create bins
    const bins = ['0-10', '11-20', '21-30', '31-40', '41+'];
    const total = 100;
    
    return bins.map(bin => {
      const frequency = Math.floor(Math.random() * 30) + 5;
      return {
        category: bin,
        frequency,
        percentage: (frequency / total) * 100
      };
    });
  }
};

/**
 * Calculate basic descriptive statistics for a numeric variable
 */
export const calculateDescriptiveStats = (data: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
} => {
  // Mock implementation
  return {
    mean: parseFloat((Math.random() * 50 + 25).toFixed(2)),
    median: parseFloat((Math.random() * 50 + 25).toFixed(2)),
    min: parseFloat((Math.random() * 10 + 1).toFixed(2)),
    max: parseFloat((Math.random() * 50 + 50).toFixed(2)),
    stdDev: parseFloat((Math.random() * 10 + 5).toFixed(2))
  };
};

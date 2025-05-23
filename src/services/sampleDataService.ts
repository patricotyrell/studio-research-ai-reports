
// Types
export interface DataVariable {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
  missingHandling?: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore';
  coding?: { [key: string]: number | null };
}

export interface DataRow {
  [key: string]: string | number | null;
}

// Sample data for Customer Satisfaction Survey
const customerSatisfactionVariables: DataVariable[] = [
  { name: 'respondent_id', type: 'numeric', missing: 0, unique: 150, example: '1001' },
  { name: 'age', type: 'numeric', missing: 5, unique: 40, example: '32' },
  { name: 'gender', type: 'categorical', missing: 2, unique: 3, example: 'Female' },
  { name: 'location', type: 'categorical', missing: 0, unique: 8, example: 'West Coast' },
  { name: 'purchase_frequency', type: 'categorical', missing: 3, unique: 5, example: 'Monthly' },
  { name: 'product_category', type: 'categorical', missing: 0, unique: 6, example: 'Electronics' },
  { name: 'satisfaction_overall', type: 'numeric', missing: 0, unique: 10, example: '8' },
  { name: 'satisfaction_quality', type: 'numeric', missing: 2, unique: 10, example: '7' },
  { name: 'satisfaction_price', type: 'numeric', missing: 1, unique: 10, example: '6' },
  { name: 'satisfaction_service', type: 'numeric', missing: 3, unique: 10, example: '8' },
  { name: 'likely_to_recommend', type: 'numeric', missing: 4, unique: 11, example: '9' },
  { name: 'feedback', type: 'text', missing: 45, unique: 95, example: 'Great customer service, but prices are high' }
];

// Sample data for Employee Engagement Survey
const employeeEngagementVariables: DataVariable[] = [
  { name: 'employee_id', type: 'numeric', missing: 0, unique: 200, example: '2050' },
  { name: 'department', type: 'categorical', missing: 0, unique: 8, example: 'Marketing' },
  { name: 'role_level', type: 'categorical', missing: 2, unique: 5, example: 'Manager' },
  { name: 'tenure_years', type: 'numeric', missing: 5, unique: 20, example: '4.5' },
  { name: 'age_group', type: 'categorical', missing: 3, unique: 5, example: '30-39' },
  { name: 'gender', type: 'categorical', missing: 4, unique: 3, example: 'Male' },
  { name: 'remote_work', type: 'categorical', missing: 0, unique: 3, example: 'Hybrid' },
  { name: 'satisfaction_overall', type: 'numeric', missing: 2, unique: 10, example: '7' },
  { name: 'satisfaction_management', type: 'numeric', missing: 5, unique: 10, example: '6' },
  { name: 'satisfaction_compensation', type: 'numeric', missing: 3, unique: 10, example: '5' },
  { name: 'satisfaction_worklife', type: 'numeric', missing: 4, unique: 10, example: '6' },
  { name: 'career_growth', type: 'numeric', missing: 6, unique: 10, example: '7' },
  { name: 'likely_to_stay', type: 'numeric', missing: 8, unique: 11, example: '8' },
  { name: 'improvement_suggestions', type: 'text', missing: 65, unique: 120, example: 'Need better communication from leadership' },
  { name: 'review_date', type: 'date', missing: 0, unique: 5, example: '2023-03-15' }
];

// Sample data for Market Research Study
const marketResearchVariables: DataVariable[] = [
  { name: 'participant_id', type: 'numeric', missing: 0, unique: 300, example: '3042' },
  { name: 'age', type: 'numeric', missing: 8, unique: 60, example: '29' },
  { name: 'gender', type: 'categorical', missing: 5, unique: 3, example: 'Non-binary' },
  { name: 'income_bracket', type: 'categorical', missing: 12, unique: 6, example: '$50,000-$74,999' },
  { name: 'education', type: 'categorical', missing: 7, unique: 6, example: "Bachelor's degree" },
  { name: 'location_type', type: 'categorical', missing: 3, unique: 3, example: 'Suburban' },
  { name: 'region', type: 'categorical', missing: 2, unique: 4, example: 'Northeast' },
  { name: 'brand_awareness', type: 'categorical', missing: 0, unique: 5, example: 'Very familiar' },
  { name: 'product_a_rating', type: 'numeric', missing: 5, unique: 10, example: '7' },
  { name: 'product_b_rating', type: 'numeric', missing: 6, unique: 10, example: '8' },
  { name: 'product_c_rating', type: 'numeric', missing: 7, unique: 10, example: '6' },
  { name: 'price_sensitivity', type: 'numeric', missing: 4, unique: 10, example: '8' },
  { name: 'purchase_intent', type: 'numeric', missing: 9, unique: 11, example: '7' },
  { name: 'competitor_comparison', type: 'categorical', missing: 15, unique: 5, example: 'Somewhat better' },
  { name: 'feature_preference', type: 'text', missing: 35, unique: 240, example: 'Durability and eco-friendly materials' },
  { name: 'survey_date', type: 'date', missing: 0, unique: 10, example: '2023-08-22' },
  { name: 'usage_frequency', type: 'categorical', missing: 8, unique: 5, example: 'Weekly' },
  { name: 'social_media_usage', type: 'categorical', missing: 12, unique: 5, example: 'Daily' }
];

// Sample preview data for each dataset
const generatePreviewRows = (variables: DataVariable[], count = 5): DataRow[] => {
  const rows: DataRow[] = [];
  
  for (let i = 0; i < count; i++) {
    const row: DataRow = {};
    
    variables.forEach(variable => {
      // Generate mock data based on variable type
      if (Math.random() > 0.9 && variable.missing > 0) {
        // Simulate missing value
        row[variable.name] = null;
      } else if (variable.type === 'numeric') {
        row[variable.name] = Math.floor(Math.random() * 10) + 1;
      } else if (variable.type === 'categorical') {
        const options = ['Option A', 'Option B', 'Option C'];
        row[variable.name] = options[Math.floor(Math.random() * options.length)];
      } else if (variable.type === 'date') {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        row[variable.name] = date.toISOString().split('T')[0];
      } else {
        // Text
        row[variable.name] = `Sample text response ${i+1}`;
      }
    });
    
    rows.push(row);
  }
  
  return rows;
};

// Export the sample datasets
export const sampleDatasets = {
  'customer-satisfaction': {
    variables: customerSatisfactionVariables,
    previewRows: generatePreviewRows(customerSatisfactionVariables),
    name: 'Customer Satisfaction Survey'
  },
  'employee-engagement': {
    variables: employeeEngagementVariables,
    previewRows: generatePreviewRows(employeeEngagementVariables),
    name: 'Employee Engagement Survey'
  },
  'market-research': {
    variables: marketResearchVariables,
    previewRows: generatePreviewRows(marketResearchVariables),
    name: 'Market Research Study'
  }
};

export function getSampleDataset(id: string) {
  return sampleDatasets[id as keyof typeof sampleDatasets];
}

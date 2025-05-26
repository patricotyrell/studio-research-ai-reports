
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { DataVariable } from '@/services/sampleDataService';

interface ChartValidationAlertProps {
  selectedVariables: string[];
  chartType: string;
  variables: DataVariable[];
  onValidationChange: (isValid: boolean) => void;
}

const ChartValidationAlert: React.FC<ChartValidationAlertProps> = ({
  selectedVariables,
  chartType,
  variables,
  onValidationChange
}) => {
  React.useEffect(() => {
    const isValid = selectedVariables.length > 0 && chartType !== '';
    onValidationChange(isValid);
  }, [selectedVariables, chartType, onValidationChange]);

  if (selectedVariables.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Select Variables</AlertTitle>
        <AlertDescription>
          Please select at least one variable to begin creating your visualization.
        </AlertDescription>
      </Alert>
    );
  }

  if (!chartType) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Select Chart Type</AlertTitle>
        <AlertDescription>
          Please select a chart type to visualize your data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle>Ready to Visualize</AlertTitle>
      <AlertDescription>
        Your visualization configuration is complete. The chart will appear below.
      </AlertDescription>
    </Alert>
  );
};

export default ChartValidationAlert;

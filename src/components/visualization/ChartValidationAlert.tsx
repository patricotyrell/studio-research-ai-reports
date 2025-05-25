
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from 'lucide-react';

interface ChartValidationAlertProps {
  primaryVariable: string;
  secondaryVariable: string;
  primaryType: string;
  secondaryType: string;
  explorationMode: string;
  validChartTypes: string[];
  selectedChartType: string;
}

const ChartValidationAlert: React.FC<ChartValidationAlertProps> = ({
  primaryVariable,
  secondaryVariable,
  primaryType,
  secondaryType,
  explorationMode,
  validChartTypes,
  selectedChartType
}) => {
  // Check if text/freeform variables are selected
  const hasTextVariable = primaryType === 'text' || secondaryType === 'text';
  
  // Check if selected chart type is valid
  const isValidSelection = validChartTypes.includes(selectedChartType);

  if (hasTextVariable) {
    return (
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Text Variables Detected</AlertTitle>
        <AlertDescription>
          Text/freeform variables ({primaryType === 'text' ? primaryVariable : ''} 
          {secondaryType === 'text' ? `, ${secondaryVariable}` : ''}) are excluded from current chart types. 
          Consider using text analysis tools or frequency counts for text data.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isValidSelection && validChartTypes.length > 0) {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Chart Type Recommendation</AlertTitle>
        <AlertDescription>
          For {primaryType} + {secondaryType} variables in {explorationMode} mode, 
          recommended chart types are: {validChartTypes.join(', ')}. 
          The current selection may not provide optimal statistical representation.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ChartValidationAlert;

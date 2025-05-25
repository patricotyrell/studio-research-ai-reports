
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, Info, ArrowRight } from 'lucide-react';
import { DataQualityIssue, DataQualityReport } from '@/services/dataQualityService';

interface DataQualityChecksProps {
  qualityReport: DataQualityReport;
  onFixIssue: (issueId: string) => void;
}

const DataQualityChecks: React.FC<DataQualityChecksProps> = ({ 
  qualityReport, 
  onFixIssue 
}) => {
  const { issues, overallScore, summary } = qualityReport;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Data Quality Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quality Score:</span>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-4 px-6">
        <Alert className="mb-4 bg-gray-50 border-gray-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {summary}
          </AlertDescription>
        </Alert>

        {issues.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">No significant data quality issues detected.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
              >
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{issue.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {issue.description}
                  </p>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    💡 {issue.suggestion}
                  </p>
                  
                  {issue.examples && issue.examples.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Examples found:</p>
                      <div className="flex flex-wrap gap-1">
                        {issue.examples.map((example, idx) => (
                          <code
                            key={idx}
                            className="px-1.5 py-0.5 bg-gray-200 text-xs rounded"
                          >
                            "{example}"
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFixIssue(issue.id)}
                    className="text-xs h-7"
                  >
                    Fix in Data Prep
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFixIssue('general')}
          >
            Review All Issues in Data Preparation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataQualityChecks;

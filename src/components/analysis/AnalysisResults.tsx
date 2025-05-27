
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Info, Download, FileText, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { StatisticalTestResult } from '@/services/statisticalTestsService';

interface AnalysisResultsProps {
  result: StatisticalTestResult;
  onDownloadResults: () => void;
  onAddToReport: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onDownloadResults,
  onAddToReport,
}) => {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  
  const formatPValue = (p: number) => {
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3);
  };

  const formatNumber = (num: number, decimals = 3) => {
    return num.toFixed(decimals);
  };

  const getEffectSizeInterpretation = (effectSize: number, testType: string) => {
    if (testType.includes('Correlation')) {
      const abs = Math.abs(effectSize);
      if (abs < 0.3) return 'small';
      if (abs < 0.7) return 'medium';
      return 'large';
    } else if (testType.includes('T-test')) {
      // Cohen's d
      if (effectSize < 0.2) return 'small';
      if (effectSize < 0.8) return 'medium';
      return 'large';
    } else if (testType.includes('ANOVA')) {
      // Eta-squared
      if (effectSize < 0.01) return 'small';
      if (effectSize < 0.06) return 'medium';
      return 'large';
    } else if (testType.includes('Chi-square')) {
      // Cramér's V
      if (effectSize < 0.1) return 'small';
      if (effectSize < 0.3) return 'medium';
      return 'large';
    }
    return 'unknown';
  };

  return (
    <div className="space-y-6">
      {/* Test Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistical Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statistic</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Test Type</TableCell>
                <TableCell>{result.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Test Statistic</TableCell>
                <TableCell className="font-mono">{formatNumber(result.testSummary.statistic)}</TableCell>
              </TableRow>
              {result.testSummary.degreesOfFreedom !== undefined && (
                <TableRow>
                  <TableCell className="font-medium">Degrees of Freedom</TableCell>
                  <TableCell className="font-mono">{result.testSummary.degreesOfFreedom}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">p-value</TableCell>
                <TableCell className="font-mono">{formatPValue(result.testSummary.pValue)}</TableCell>
              </TableRow>
              {result.testSummary.effectSize !== undefined && (
                <TableRow>
                  <TableCell className="font-medium">Effect Size</TableCell>
                  <TableCell className="font-mono">
                    {formatNumber(result.testSummary.effectSize)} 
                    <span className="text-sm text-muted-foreground ml-2">
                      ({getEffectSizeInterpretation(result.testSummary.effectSize, result.type)})
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {result.testSummary.confidenceInterval && (
                <TableRow>
                  <TableCell className="font-medium">95% Confidence Interval</TableCell>
                  <TableCell className="font-mono">
                    [{formatNumber(result.testSummary.confidenceInterval[0])}, {formatNumber(result.testSummary.confidenceInterval[1])}]
                  </TableCell>
                </TableRow>
              )}
              {result.testSummary.sampleSize && (
                <TableRow>
                  <TableCell className="font-medium">Sample Size</TableCell>
                  <TableCell className="font-mono">{result.testSummary.sampleSize}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Significance Badge */}
          <div className="mt-4">
            <Badge 
              variant={result.significant ? "default" : "secondary"}
              className={`${result.significant ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}
            >
              {result.significant ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Statistically Significant (p &lt; 0.05)
                </>
              ) : (
                <>
                  <Info className="h-3 w-3 mr-1" />
                  Not Statistically Significant (p ≥ 0.05)
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Assumption Checks */}
      {result.assumptions && (
        <Card>
          <CardHeader>
            <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <CardTitle className="text-lg">Statistical Assumptions</CardTitle>
                {assumptionsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {result.assumptions.normality && (
                      <div className="flex items-start space-x-3">
                        {result.assumptions.normality.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            Normality Assumption: {result.assumptions.normality.passed ? 'Met' : 'Violated'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.assumptions.normality.testName} (p = {formatPValue(result.assumptions.normality.pValue)})
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {result.assumptions.homogeneity && (
                      <div className="flex items-start space-x-3">
                        {result.assumptions.homogeneity.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            Homogeneity of Variance: {result.assumptions.homogeneity.passed ? 'Met' : 'Violated'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.assumptions.homogeneity.testName} (p = {formatPValue(result.assumptions.homogeneity.pValue)})
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {result.assumptions.recommendations && result.assumptions.recommendations.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <h4 className="font-medium text-amber-800 mb-2">Recommendations:</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {result.assumptions.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}

      {/* AI Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistical Interpretation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-md">
            <p className="text-gray-700 leading-relaxed">{result.interpretation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onDownloadResults} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Results
        </Button>
        <Button 
          onClick={onAddToReport}
          className="bg-research-700 hover:bg-research-800 flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Add to Report
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResults;

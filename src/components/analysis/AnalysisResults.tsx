
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Info, Download, FileText } from 'lucide-react';

interface AnalysisResult {
  type: string;
  description: string;
  pValue: number;
  significant: boolean;
  statistic: number;
  degreesOfFreedom?: number;
  effectSize?: number;
  interpretation: string;
  testSummary: {
    statistic: number;
    pValue: number;
    degreesOfFreedom?: number;
    effectSize?: number;
    confidenceInterval?: [number, number];
  };
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onDownloadResults: () => void;
  onAddToReport: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onDownloadResults,
  onAddToReport,
}) => {
  const formatPValue = (p: number) => {
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3);
  };

  const formatNumber = (num: number, decimals = 3) => {
    return num.toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      {/* Test Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Summary</CardTitle>
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
              {result.testSummary.degreesOfFreedom && (
                <TableRow>
                  <TableCell className="font-medium">Degrees of Freedom</TableCell>
                  <TableCell className="font-mono">{result.testSummary.degreesOfFreedom}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">p-value</TableCell>
                <TableCell className="font-mono">{formatPValue(result.testSummary.pValue)}</TableCell>
              </TableRow>
              {result.testSummary.effectSize && (
                <TableRow>
                  <TableCell className="font-medium">Effect Size</TableCell>
                  <TableCell className="font-mono">{formatNumber(result.testSummary.effectSize)}</TableCell>
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
                  Statistically Significant
                </>
              ) : (
                <>
                  <Info className="h-3 w-3 mr-1" />
                  Not Statistically Significant
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Interpretation</CardTitle>
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

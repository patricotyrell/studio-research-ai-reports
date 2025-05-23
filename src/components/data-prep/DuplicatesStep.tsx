import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CopyX, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getDatasetPreviewRows } from '@/utils/dataUtils';

interface DuplicatesStepProps {
  onComplete: (autoApplied: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DuplicateGroup {
  id: number;
  count: number;
  rowIndexes: number[];
  sampleValues: {[key: string]: string};
  selected: boolean;
}

interface InconsistentValue {
  variable: string;
  values: string[];
  rowIndexes: number[];
  selected: boolean;
}

const DuplicatesStep: React.FC<DuplicatesStepProps> = ({ onComplete, onNext, onBack }) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [processingAutomatic, setProcessingAutomatic] = useState(false);
  const [completedAutomatic, setCompletedAutomatic] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [inconsistentValues, setInconsistentValues] = useState<InconsistentValue[]>([]);

  // Simulate detection of duplicates and inconsistencies
  useEffect(() => {
    const rows = getDatasetPreviewRows();
    
    // For demo purposes, create simulated duplicates
    const simulatedDuplicates: DuplicateGroup[] = [
      {
        id: 1,
        count: 2,
        rowIndexes: [14, 87],
        sampleValues: {
          respondent_id: '1045',
          age: '34',
          gender: 'Male',
          satisfaction: '4'
        },
        selected: true
      },
      {
        id: 2,
        count: 3,
        rowIndexes: [22, 56, 129],
        sampleValues: {
          respondent_id: '1078',
          age: '29',
          gender: 'Female',
          satisfaction: '5'
        },
        selected: true
      }
    ];
    
    // For demo purposes, create simulated inconsistent values
    const simulatedInconsistencies: InconsistentValue[] = [
      {
        variable: 'gender',
        values: ['male', 'Male'],
        rowIndexes: [8, 17, 42, 65],
        selected: true
      },
      {
        variable: 'education',
        values: ['Bachelors degree', "Bachelor's degree"],
        rowIndexes: [12, 33, 79, 104],
        selected: true
      }
    ];
    
    setDuplicateGroups(simulatedDuplicates);
    setInconsistentValues(simulatedInconsistencies);
  }, []);
  
  const handleAutomaticCleanup = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Keep automatic selections
      setProcessingAutomatic(false);
      setCompletedAutomatic(true);
    }, 1500);
  };

  const handleManualReview = () => {
    setShowGuidance(false);
    setShowManualOptions(true);
  };
  
  const handleDuplicateSelection = (index: number, selected: boolean) => {
    setDuplicateGroups(prev => {
      const updated = [...prev];
      updated[index] = {...updated[index], selected};
      return updated;
    });
  };
  
  const handleInconsistencySelection = (index: number, selected: boolean) => {
    setInconsistentValues(prev => {
      const updated = [...prev];
      updated[index] = {...updated[index], selected};
      return updated;
    });
  };
  
  const handleComplete = () => {
    onComplete(completedAutomatic);
    onNext();
  };
  
  const hasIssues = duplicateGroups.length > 0 || inconsistentValues.length > 0;

  if (showGuidance) {
    if (!hasIssues) {
      return (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>No Data Issues Detected</AlertTitle>
          <AlertDescription>
            Great news! We didn't detect any duplicate entries or inconsistent values in your dataset.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <AIGuidance
        title="Fix Duplicates & Inconsistencies"
        description={
          `We found ${duplicateGroups.length} duplicate entries and ${inconsistentValues.length} inconsistent values in your dataset.`
        }
        automaticDescription="AI will remove exact duplicates and standardize inconsistent values using intelligent pattern recognition."
        manualDescription="Review each issue individually and decide how to handle duplicates and standardize values."
        onAutomatic={handleAutomaticCleanup}
        onManual={handleManualReview}
        actionInProgress={processingAutomatic}
        icon={<CopyX className="h-6 w-6 text-red-500" />}
      />
    );
  }

  if (completedAutomatic) {
    const selectedDuplicates = duplicateGroups.filter(d => d.selected);
    const selectedInconsistencies = inconsistentValues.filter(i => i.selected);
    
    return (
      <StepFlow
        title="Data Issues Fixed"
        description="AI has cleaned up duplicates and inconsistencies in your dataset."
        onComplete={handleComplete}
        onBack={() => setShowGuidance(true)}
        showBackButton={true}
        completeButtonText="Continue to Next Step"
      >
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            We've fixed {selectedDuplicates.length} duplicate entries and {selectedInconsistencies.length} inconsistent values in your dataset.
          </AlertDescription>
        </Alert>
        
        {selectedDuplicates.length > 0 && (
          <>
            <h3 className="font-medium text-lg mb-2">Duplicate Entries Resolved</h3>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Duplicate Group</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Action Taken</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDuplicates.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">Group {group.id}</TableCell>
                        <TableCell>{group.count} entries</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            Removed {group.count - 1} duplicate entries
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
        
        {selectedInconsistencies.length > 0 && (
          <>
            <h3 className="font-medium text-lg mb-2">Inconsistent Values Fixed</h3>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead>Inconsistent Values</TableHead>
                      <TableHead>Standardized To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInconsistencies.map((inconsistency) => (
                      <TableRow key={inconsistency.variable}>
                        <TableCell className="font-medium">{inconsistency.variable}</TableCell>
                        <TableCell>
                          {inconsistency.values.map((value, i) => (
                            <Badge key={i} variant="outline" className="mr-1 bg-gray-50">
                              {value}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {inconsistency.values[1]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </StepFlow>
    );
  }

  if (showManualOptions) {
    return (
      <StepFlow
        title="Fix Duplicates & Inconsistencies"
        description="Review and fix data quality issues in your dataset."
        onComplete={handleComplete}
        onCancel={() => setShowGuidance(true)}
        onBack={onBack}
        showBackButton={true}
        completeButtonText="Apply & Continue"
      >
        {duplicateGroups.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium text-lg mb-4">Duplicate Entries</h3>
            
            <div className="space-y-6">
              {duplicateGroups.map((group, index) => (
                <Card key={group.id} className="border-amber-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={group.selected}
                          onCheckedChange={(checked) => handleDuplicateSelection(index, checked === true)}
                        />
                        <h4 className="font-medium">Duplicate Group {group.id}</h4>
                        <Badge className="bg-amber-100 text-amber-800">
                          {group.count} identical entries
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-3 rounded-md mb-3">
                      <p className="text-sm text-amber-800 mb-2">
                        Found {group.count} rows with identical data at rows: {group.rowIndexes.join(', ')}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(group.sampleValues).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {group.selected ? 
                        "Will keep first occurrence and remove duplicates." :
                        "No action will be taken (duplicates will be preserved)."}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {inconsistentValues.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-4">Inconsistent Values</h3>
            
            <div className="space-y-6">
              {inconsistentValues.map((inconsistency, index) => (
                <Card key={inconsistency.variable} className="border-blue-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={inconsistency.selected}
                          onCheckedChange={(checked) => handleInconsistencySelection(index, checked === true)}
                        />
                        <h4 className="font-medium">Variable: {inconsistency.variable}</h4>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                      <p className="text-sm text-blue-800 mb-2">
                        Found inconsistent values in rows: {inconsistency.rowIndexes.join(', ')}
                      </p>
                      
                      <div className="flex gap-3 items-center">
                        <div>
                          {inconsistency.values.map((value, i) => (
                            <div key={i} className="mb-1">
                              <Badge variant="outline" className="bg-white">
                                {value}
                              </Badge>
                              {i === 0 && <span className="text-sm mx-2">vs</span>}
                            </div>
                          ))}
                        </div>
                        
                        {inconsistency.selected && (
                          <div className="ml-6">
                            <p className="text-sm mb-1">Will standardize to:</p>
                            <Badge className="bg-blue-100 text-blue-800">
                              {inconsistency.values[1]}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {inconsistency.selected ? 
                        "Will standardize all values to the format shown above." :
                        "No action will be taken (inconsistent values will be preserved)."}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">About Duplicate & Inconsistency Handling</h4>
              <p className="text-sm text-gray-600">
                Removing duplicates ensures your statistical tests aren't biased by repeated data.
                Standardizing inconsistent values (e.g., "male" vs "Male") prevents them from being 
                treated as different categories, which would skew your analysis results.
              </p>
            </div>
          </div>
        </div>
      </StepFlow>
    );
  }

  return null;
};

export default DuplicatesStep;

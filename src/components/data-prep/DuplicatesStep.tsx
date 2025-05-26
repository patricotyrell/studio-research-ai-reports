import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CopyX, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AIGuidance from '../AIGuidance';
import StepFlow from '../StepFlow';
import { getAllDatasetRows } from '@/utils/datasetCache';

interface DuplicatesStepProps {
  onComplete: (autoApplied: boolean, changes?: any) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  onSkipToSummary?: () => void;
  onNavigateToStep?: (step: number) => void;
  currentStep?: number;
  totalSteps?: number;
  hideNavigation?: boolean;
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

const DuplicatesStep: React.FC<DuplicatesStepProps> = ({ 
  onComplete, 
  onNext, 
  onBack, 
  showBackButton = true,
  onSkipToSummary,
  onNavigateToStep,
  currentStep,
  totalSteps,
  hideNavigation = false
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [processingAutomatic, setProcessingAutomatic] = useState(false);
  const [completedAutomatic, setCompletedAutomatic] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [inconsistentValues, setInconsistentValues] = useState<InconsistentValue[]>([]);
  const [analyzing, setAnalyzing] = useState(true);

  // FIXED: Analyze actual data for duplicates without modifying the cache
  useEffect(() => {
    const analyzeData = async () => {
      setAnalyzing(true);
      
      try {
        // CRITICAL: Get read-only copy of all rows without modifying cache
        const allRows = getAllDatasetRows();
        
        console.log(`Analyzing ${allRows.length} rows for duplicates and inconsistencies (READ-ONLY)`);
        
        if (allRows.length === 0) {
          setAnalyzing(false);
          return;
        }
        
        // Create a working copy for analysis to avoid modifying original data
        const workingCopy = allRows.map(row => ({ ...row }));
        
        // FIXED: Use much more precise duplicate detection
        const duplicates = findExactDuplicateRows(workingCopy);
        console.log(`Found ${duplicates.length} exact duplicate groups (analysis only, no changes applied)`);
        
        // Detect inconsistent values
        const inconsistencies = findInconsistentValues(workingCopy);
        console.log(`Found ${inconsistencies.length} inconsistent value patterns (analysis only)`);
        
        setDuplicateGroups(duplicates);
        setInconsistentValues(inconsistencies);
        
      } catch (error) {
        console.error('Error analyzing data:', error);
      } finally {
        setAnalyzing(false);
      }
    };
    
    analyzeData();
  }, []);

  // FIXED: Ultra-precise duplicate detection - only truly identical rows
  const findExactDuplicateRows = (rows: any[]): DuplicateGroup[] => {
    console.log('Starting PRECISE duplicate detection on', rows.length, 'rows');
    
    const rowGroups = new Map<string, number[]>();
    
    rows.forEach((row, index) => {
      // Create the most precise row signature possible
      const sortedKeys = Object.keys(row).sort();
      
      // Create normalized row signature with strict value handling
      const rowValues = sortedKeys.map(key => {
        const value = row[key];
        // Normalize values very carefully
        if (value === null || value === undefined) return '__NULL__';
        if (value === '') return '__EMPTY_STRING__';
        if (typeof value === 'number') return `__NUM__${value}`;
        if (typeof value === 'boolean') return `__BOOL__${value}`;
        // Convert to string and preserve exact case and whitespace
        return `__STR__${String(value)}`;
      });
      
      const rowSignature = `ROW::${rowValues.join('||')}`;
      
      if (!rowGroups.has(rowSignature)) {
        rowGroups.set(rowSignature, []);
      }
      rowGroups.get(rowSignature)!.push(index);
    });
    
    // Only consider groups with more than one row as duplicates
    const duplicateGroups: DuplicateGroup[] = [];
    let groupId = 1;
    
    rowGroups.forEach((indexes, signature) => {
      if (indexes.length > 1) {
        const firstRow = rows[indexes[0]];
        const sampleValues: {[key: string]: string} = {};
        
        // Show first few fields for preview
        const previewKeys = Object.keys(firstRow).slice(0, 3);
        previewKeys.forEach(key => {
          const value = firstRow[key];
          sampleValues[key] = value === null || value === undefined ? 'NULL' : String(value);
        });
        
        duplicateGroups.push({
          id: groupId++,
          count: indexes.length,
          rowIndexes: [...indexes].sort((a, b) => a - b), // Sort indexes for consistency
          sampleValues,
          selected: true
        });
        
        console.log(`EXACT duplicate group ${groupId - 1}: ${indexes.length} identical rows at indexes [${indexes.slice(0, 3).join(', ')}${indexes.length > 3 ? '...' : ''}]`);
      }
    });
    
    console.log(`Total EXACT duplicate groups found: ${duplicateGroups.length}`);
    return duplicateGroups;
  };

  // Function to find inconsistent categorical values (case variations, etc.)
  const findInconsistentValues = (rows: any[]): InconsistentValue[] => {
    const inconsistencies: InconsistentValue[] = [];
    
    if (rows.length === 0) return inconsistencies;
    
    // Get column names
    const columns = Object.keys(rows[0]);
    
    columns.forEach(column => {
      // Get all unique values for this column
      const values = rows
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && val !== '')
        .map(val => String(val).trim());
      
      const uniqueValues = [...new Set(values)];
      
      // Only check for inconsistencies in categorical-like columns
      // Skip columns that are likely to have many unique values (IDs, names, etc.)
      if (uniqueValues.length > 20 || uniqueValues.length < 2) {
        return; // Skip this column
      }
      
      // Look for case variations and similar strings
      const variations = findStringVariations(uniqueValues);
      
      if (variations.length > 0) {
        // Get row indexes where these variations occur
        const affectedRows: number[] = [];
        rows.forEach((row, index) => {
          if (variations.includes(String(row[column] || '').trim())) {
            affectedRows.push(index);
          }
        });
        
        inconsistencies.push({
          variable: column,
          values: variations,
          rowIndexes: affectedRows,
          selected: true
        });
      }
    });
    
    return inconsistencies;
  };

  // Function to find string variations (case differences, etc.)
  const findStringVariations = (values: string[]): string[] => {
    const groups = new Map<string, string[]>();
    
    values.forEach(value => {
      const normalized = value.toLowerCase().trim();
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(value);
    });
    
    // Find groups with multiple variations
    for (const [normalized, variations] of groups.entries()) {
      if (variations.length > 1 && variations.length <= 5) {
        // Only return if there are reasonable variations (not too many)
        const uniqueVariations = [...new Set(variations)];
        if (uniqueVariations.length > 1) {
          return uniqueVariations.slice(0, 4); // Limit to 4 variations
        }
      }
    }
    
    return [];
  };
  
  const handleAutomaticCleanup = () => {
    setProcessingAutomatic(true);
    setShowGuidance(false);
    
    // Simulate AI processing time
    setTimeout(() => {
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
    const selectedDuplicates = duplicateGroups.filter(d => d.selected);
    const selectedInconsistencies = inconsistentValues.filter(i => i.selected);
    
    // FIXED: Calculate precise rows to remove
    const rowIndexesToRemove: number[] = [];
    selectedDuplicates.forEach(group => {
      // For each group, keep the FIRST occurrence (lowest index) and remove the rest
      const sortedIndexes = [...group.rowIndexes].sort((a, b) => a - b);
      rowIndexesToRemove.push(...sortedIndexes.slice(1)); // Remove all except first
    });
    
    // Sort row indexes in descending order for safe removal
    rowIndexesToRemove.sort((a, b) => b - a);
    
    console.log(`Will remove ${rowIndexesToRemove.length} exact duplicate rows:`, rowIndexesToRemove.slice(0, 10));
    
    // Create standardized values mapping for inconsistencies
    const standardizedValues: {[varName: string]: {[oldValue: string]: string}} = {};
    selectedInconsistencies.forEach(inconsistency => {
      const mapping: {[oldValue: string]: string} = {};
      const standardValue = inconsistency.values[0]; // Use first value as standard
      inconsistency.values.forEach(value => {
        mapping[value] = standardValue;
      });
      standardizedValues[inconsistency.variable] = mapping;
    });
    
    const changes = {
      duplicatesRemoved: rowIndexesToRemove.length,
      inconsistentValuesFixed: selectedInconsistencies.length,
      standardizedValues,
      selectedDuplicateGroups: selectedDuplicates,
      selectedInconsistencies,
      exactDuplicatesOnly: true,
      // CRITICAL: Provide exact row indexes for precise removal
      rowIndexesToRemove: rowIndexesToRemove
    };
    
    console.log('Duplicates step changes (PRECISE):', {
      ...changes,
      rowIndexesToRemove: rowIndexesToRemove.slice(0, 10) // Log first 10 for brevity
    });
    
    onComplete(completedAutomatic, changes);
  };
  
  const hasIssues = duplicateGroups.length > 0 || inconsistentValues.length > 0;

  if (analyzing) {
    return (
      <StepFlow
        title="Analyzing Data for Issues"
        description="Scanning your dataset for duplicate entries and inconsistent values..."
        onComplete={() => {}}
        onBack={onBack}
        showBackButton={showBackButton}
        onSkipToSummary={onSkipToSummary}
        onNavigateToStep={onNavigateToStep}
        currentStep={currentStep}
        totalSteps={totalSteps}
        hideNavigation={hideNavigation}
        actionInProgress={true}
        completeButtonText="Analyzing..."
      >
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Please wait while we analyze your data...</p>
        </div>
      </StepFlow>
    );
  }

  if (showGuidance) {
    if (!hasIssues) {
      return (
        <StepFlow
          title="No Data Issues Detected"
          description="Great news! We didn't detect any duplicate entries or inconsistent values in your dataset."
          onComplete={handleComplete}
          onBack={onBack}
          showBackButton={showBackButton}
          onSkipToSummary={onSkipToSummary}
          onNavigateToStep={onNavigateToStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
          hideNavigation={hideNavigation}
          completeButtonText="Continue to Next Step"
        >
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Excellent Data Quality</AlertTitle>
            <AlertDescription>
              Your dataset appears to be clean with no exact duplicate entries or inconsistent categorical values detected.
            </AlertDescription>
          </Alert>
        </StepFlow>
      );
    }
    
    return (
      <StepFlow
        title="Fix Duplicates & Inconsistencies"
        description={`We found ${duplicateGroups.length} exact duplicate entries and ${inconsistentValues.length} inconsistent values in your dataset.`}
        onComplete={() => {}}
        onBack={onBack}
        showBackButton={showBackButton}
        onSkipToSummary={onSkipToSummary}
        onNavigateToStep={onNavigateToStep}
        currentStep={currentStep}
        totalSteps={totalSteps}
        hideNavigation={hideNavigation}
      >
        <AIGuidance
          title="Fix Duplicates & Inconsistencies"
          description={`We found ${duplicateGroups.length} exact duplicate entries and ${inconsistentValues.length} inconsistent values in your dataset.`}
          automaticDescription="AI will remove exact duplicates (100% identical rows) and standardize inconsistent values using intelligent pattern recognition."
          manualDescription="Review each issue individually and decide how to handle exact duplicates and standardize values."
          onAutomatic={handleAutomaticCleanup}
          onManual={handleManualReview}
          actionInProgress={processingAutomatic}
          icon={<CopyX className="h-6 w-6 text-red-500" />}
        />
      </StepFlow>
    );
  }

  if (completedAutomatic) {
    const selectedDuplicates = duplicateGroups.filter(d => d.selected);
    const selectedInconsistencies = inconsistentValues.filter(i => i.selected);
    
    return (
      <StepFlow
        title="Data Issues Fixed"
        description="AI has cleaned up exact duplicates and inconsistencies in your dataset."
        onComplete={handleComplete}
        onBack={() => setShowGuidance(true)}
        showBackButton={showBackButton}
        onSkipToSummary={onSkipToSummary}
        onNavigateToStep={onNavigateToStep}
        currentStep={currentStep}
        totalSteps={totalSteps}
        hideNavigation={hideNavigation}
        completeButtonText="Continue to Next Step"
      >
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            We've fixed {selectedDuplicates.length} exact duplicate entries and {selectedInconsistencies.length} inconsistent values in your dataset.
          </AlertDescription>
        </Alert>
        
        {selectedDuplicates.length > 0 && (
          <>
            <h3 className="font-medium text-lg mb-2">Exact Duplicate Entries Resolved</h3>
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
                        <TableCell>{group.count} identical entries</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            Removed {group.count - 1} exact duplicates
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
                            {inconsistency.values[0]}
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
        onBack={showBackButton ? onBack : undefined}
        showBackButton={showBackButton}
        onSkipToSummary={onSkipToSummary}
        onNavigateToStep={onNavigateToStep}
        currentStep={currentStep}
        totalSteps={totalSteps}
        hideNavigation={hideNavigation}
        completeButtonText="Apply & Continue"
      >
        {duplicateGroups.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium text-lg mb-4">Exact Duplicate Entries</h3>
            
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
                        <h4 className="font-medium">Exact Duplicate Group {group.id}</h4>
                        <Badge className="bg-amber-100 text-amber-800">
                          {group.count} 100% identical entries
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-3 rounded-md mb-3">
                      <p className="text-sm text-amber-800 mb-2">
                        Found {group.count} rows with completely identical data at rows: {group.rowIndexes.join(', ')}
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
                        "Will keep first occurrence and remove exact duplicates." :
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
                              {i === 0 && i < inconsistency.values.length - 1 && <span className="text-sm mx-2">vs</span>}
                            </div>
                          ))}
                        </div>
                        
                        {inconsistency.selected && (
                          <div className="ml-6">
                            <p className="text-sm mb-1">Will standardize to:</p>
                            <Badge className="bg-blue-100 text-blue-800">
                              {inconsistency.values[0]}
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
              <h4 className="font-medium mb-1">About Exact Duplicate & Inconsistency Handling</h4>
              <p className="text-sm text-gray-600">
                We only remove rows that are 100% identical across all fields to preserve legitimate data.
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

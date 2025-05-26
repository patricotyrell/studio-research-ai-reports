import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StepIndicator from '@/components/StepIndicator';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import MissingValuesStep from '@/components/data-prep/MissingValuesStep';
import StandardizeVariablesStep from '@/components/data-prep/StandardizeVariablesStep';
import DuplicatesStep from '@/components/data-prep/DuplicatesStep';
import RecodeVariablesStep from '@/components/data-prep/RecodeVariablesStep';
import CompositeScoresStep from '@/components/data-prep/CompositeScoresStep';
import RemoveColumnsStep from '@/components/data-prep/RemoveColumnsStep';
import DataPrepSummary from '@/components/DataPrepSummary';
import { saveStepCompletion, getCompletedSteps, getCurrentDatasetState } from '@/utils/dataUtils';
import { getDatasetInfo, logDatasetState } from '@/utils/datasetCache';

const TOTAL_STEPS = 6;

const DataPreparation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(getCompletedSteps());
  const [loading, setLoading] = useState(false);
  const [stepChanges, setStepChanges] = useState<{[key: string]: any}>({});
  
  // Check if user is logged in and has data to prepare
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const currentFile = localStorage.getItem('currentFile');
    if (!currentFile) {
      navigate('/upload');
      return;
    }
    
    // CRITICAL: Log dataset state on component mount
    console.log('🎯 DATA PREPARATION - Component mounted');
    const datasetInfo = getDatasetInfo();
    console.log('📊 Data Preparation - Current dataset info:', datasetInfo);
    
    // Load current dataset state to restore any existing changes
    const currentState = getCurrentDatasetState();
    if (currentState.prepChanges) {
      setStepChanges(currentState.prepChanges);
      console.log('🔄 Restored existing prep changes:', currentState.prepChanges);
    }
  }, [navigate]);

  // FIXED: Only apply changes when step is explicitly completed with real changes
  const handleStepComplete = (step: string, autoApplied: boolean, changes?: any) => {
    console.log(`✅ Step ${step} completed:`, { autoApplied, changes, hasChanges: changes && Object.keys(changes).length > 0 });
    
    // CRITICAL: Only proceed if there are actual changes to apply
    if (!changes || Object.keys(changes).length === 0) {
      console.log(`⏭️ Step ${step} completed but no changes to apply - preserving dataset`);
      // Mark step as completed but don't modify data
      const newCompletedSteps = { ...completedSteps };
      newCompletedSteps[step as keyof typeof completedSteps] = true;
      setCompletedSteps(newCompletedSteps);
      saveStepCompletion(step, true);
      
      // Log the skipped step
      const datasetInfo = getDatasetInfo();
      console.log(`📋 Step ${step} skipped – no transformation applied. Dataset row count preserved: ${datasetInfo.totalRows}`);
      return;
    }
    
    console.log(`🔄 APPLYING CHANGES for step: ${step}`);
    
    // Store the changes for this step
    const newStepChanges = { ...stepChanges, [step]: changes };
    setStepChanges(newStepChanges);
    
    // CRITICAL: Only apply changes to dataset when step is actually completed WITH changes
    import('@/utils/dataUtils').then(({ applyDataPrepChanges }) => {
      console.log('🚀 APPLYING CHANGES to dataset for step:', step);
      const beforeInfo = getDatasetInfo();
      console.log('📊 Dataset before applying changes:', beforeInfo);
      
      applyDataPrepChanges(step, changes);
      
      const afterInfo = getDatasetInfo();
      console.log('📊 Dataset after applying changes:', afterInfo);
      console.log(`📈 Row count change: ${beforeInfo.totalRows} → ${afterInfo.totalRows} (${afterInfo.totalRows - beforeInfo.totalRows})`);
      
      // Clear any subsequent step changes since data has changed
      const stepOrder = ['missingValues', 'standardizeVariables', 'fixDuplicates', 'recodeVariables', 'compositeScores', 'removeColumns'];
      const currentStepIndex = stepOrder.indexOf(step);
      if (currentStepIndex >= 0) {
        const updatedStepChanges = { ...newStepChanges };
        stepOrder.slice(currentStepIndex + 1).forEach(laterStep => {
          delete updatedStepChanges[laterStep];
          // Also reset completion status for later steps
          const newCompletedSteps = { ...completedSteps };
          newCompletedSteps[laterStep as keyof typeof completedSteps] = false;
          setCompletedSteps(newCompletedSteps);
          saveStepCompletion(laterStep, false);
          console.log(`🔄 Reset later step: ${laterStep}`);
        });
        setStepChanges(updatedStepChanges);
      }
    });
    
    // Mark step as completed
    const newCompletedSteps = { ...completedSteps };
    newCompletedSteps[step as keyof typeof completedSteps] = true;
    setCompletedSteps(newCompletedSteps);
    
    // Save completion status
    saveStepCompletion(step, true);
  };
  
  // FIXED: Navigation should NEVER trigger data changes - pure navigation only
  const handleNext = () => {
    console.log('➡️ NAVIGATION: Moving to next step (NO data changes)');
    const beforeInfo = getDatasetInfo();
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step, go to summary
      setCurrentStep(7);
    }
    
    const afterInfo = getDatasetInfo();
    console.log(`📊 Dataset preserved during navigation: ${beforeInfo.totalRows} rows maintained`);
    if (beforeInfo.totalRows !== afterInfo.totalRows) {
      console.error('🚨 ERROR: Dataset changed during navigation!', { before: beforeInfo.totalRows, after: afterInfo.totalRows });
    }
  };
  
  const handleBack = () => {
    console.log('⬅️ NAVIGATION: Moving to previous step (NO data changes)');
    const beforeInfo = getDatasetInfo();
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
    
    const afterInfo = getDatasetInfo();
    console.log(`📊 Dataset preserved during navigation: ${beforeInfo.totalRows} rows maintained`);
  };

  const handleSkipToSummary = () => {
    console.log('⏭️ NAVIGATION: Skipping to summary (NO data changes)');
    const beforeInfo = getDatasetInfo();
    setCurrentStep(7);
    const afterInfo = getDatasetInfo();
    console.log(`📊 Dataset preserved during skip: ${beforeInfo.totalRows} rows maintained`);
  };

  // FIXED: Step navigation should NEVER modify data - pure navigation only
  const handleNavigateToStep = (step: number) => {
    console.log(`🎯 NAVIGATION: Moving to step ${step} (NO data changes applied)`);
    const beforeInfo = getDatasetInfo();
    setCurrentStep(step);
    const afterInfo = getDatasetInfo();
    console.log(`📊 Dataset preserved during step navigation: ${beforeInfo.totalRows} rows maintained`);
  };
  
  const handleFinish = () => {
    console.log('🏁 FINISHING data preparation');
    setLoading(true);
    
    // Log final state before navigating
    const finalState = getCurrentDatasetState();
    const datasetInfo = getDatasetInfo();
    console.log('📊 Final dataset state before navigation to visualization:', finalState);
    console.log('📊 Final dataset info:', datasetInfo);
    console.log(`📈 Carrying ${datasetInfo.totalRows} rows to Visualization module`);
    
    setTimeout(() => {
      setLoading(false);
      navigate('/visualization');
    }, 1000);
  };
  
  const renderCurrentStep = () => {
    // Updated step order: duplicates moved to step 3 (before recoding)
    const stepNames = ['missingValues', 'standardizeVariables', 'fixDuplicates', 'recodeVariables', 'compositeScores', 'removeColumns'];
    
    const commonProps = {
      onComplete: (autoApplied: boolean, changes?: any) => {
        handleStepComplete(stepNames[currentStep - 1], autoApplied, changes);
        handleNext();
      },
      onNext: handleNext,
      onBack: handleBack,
      onSkipToSummary: handleSkipToSummary,
      onNavigateToStep: handleNavigateToStep,
      currentStep,
      totalSteps: TOTAL_STEPS
    };

    switch (currentStep) {
      case 1:
        return (
          <MissingValuesStep 
            {...commonProps}
            showBackButton={false} // First step shouldn't have back button
          />
        );
      case 2:
        return (
          <StandardizeVariablesStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 3:
        return (
          <DuplicatesStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 4:
        return (
          <RecodeVariablesStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 5:
        return (
          <CompositeScoresStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 6:
        return (
          <RemoveColumnsStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 7:
        return (
          <DataPrepSummary 
            completedSteps={completedSteps} 
            onContinue={handleFinish}
            onBack={handleBack}
            showBackButton={true}
          />
        );
      default:
        return null;
    }
  };
  
  // Get current dataset info for debugging
  const datasetInfo = getDatasetInfo();
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={3} 
          steps={['Upload', 'Overview', 'Preparation', 'Visualization', 'Analysis', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-research-900 mb-2">Data Preparation</h1>
            <p className="text-gray-600">
              Prepare your data for analysis by following our AI-guided workflow or making manual adjustments.
            </p>
            {/* Enhanced debug info with session tracking */}
            <div className="text-xs text-gray-400 mt-2 font-mono">
              📊 Dataset: {datasetInfo.totalRows} rows, {datasetInfo.totalVariables} variables 
              {datasetInfo.isRealData ? " (Real Data)" : " (Sample Data)"} 
              | Session: {datasetInfo.sessionId?.slice(-8) || 'N/A'}
              | {datasetInfo.locked ? "🔒 Locked" : "🔓 Unlocked"}
              | File: {datasetInfo.fileName}
            </div>
          </div>
          
          {currentStep < 7 && (
            <>
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>Step {currentStep} of {TOTAL_STEPS}: {getStepTitle(currentStep)}</AlertTitle>
                <AlertDescription>
                  {getStepDescription(currentStep)}
                </AlertDescription>
              </Alert>

              {/* Step Navigation */}
              <div className="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Step
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
                    <Button
                      key={step}
                      variant={step === currentStep ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNavigateToStep(step)}
                      className={`w-10 h-10 p-0 ${
                        step === currentStep 
                          ? "bg-research-700 hover:bg-research-800" 
                          : completedSteps[Object.keys(completedSteps)[step - 1] as keyof typeof completedSteps]
                            ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                            : ""
                      }`}
                    >
                      {step}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentStep === TOTAL_STEPS}
                  className="flex items-center gap-2"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          <Card className="mb-6">
            <CardContent className="p-0">
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

function getStepTitle(step: number): string {
  switch (step) {
    case 1: return "Handle Missing Values & Data Issues";
    case 2: return "Standardize Variable Names & Values";
    case 3: return "Fix Duplicates & Inconsistencies";
    case 4: return "Recode Variables";
    case 5: return "Create Composite Scores";
    case 6: return "Remove Unused Columns";
    default: return "";
  }
}

function getStepDescription(step: number): string {
  switch (step) {
    case 1: 
      return "Handle missing values and invalid data that can bias your results.";
    case 2:
      return "Clean up variable names and standardize categorical values for consistency.";
    case 3:
      return "Find and fix duplicate entries and inconsistent values in your dataset.";
    case 4:
      return "Assign numeric codes to categorical variables for analysis.";
    case 5:
      return "Combine multiple related questions to create composite scores or indices.";
    case 6:
      return "Remove variables that are irrelevant or have too many missing values.";
    default:
      return "";
  }
}

export default DataPreparation;

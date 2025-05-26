
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
import RecodeVariablesStep from '@/components/data-prep/RecodeVariablesStep';
import CompositeScoresStep from '@/components/data-prep/CompositeScoresStep';
import RemoveColumnsStep from '@/components/data-prep/RemoveColumnsStep';
import DuplicatesStep from '@/components/data-prep/DuplicatesStep';
import DataPrepSummary from '@/components/DataPrepSummary';
import { saveStepCompletion, getCompletedSteps, applyDataPrepChanges, getCurrentDatasetState } from '@/utils/dataUtils';

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
    
    // Load current dataset state to restore any existing changes
    const currentState = getCurrentDatasetState();
    if (currentState.prepChanges) {
      setStepChanges(currentState.prepChanges);
    }
  }, [navigate]);

  const handleStepComplete = (step: string, autoApplied: boolean, changes?: any) => {
    console.log(`Step ${step} completed with changes:`, changes);
    
    // Store the changes for this step
    if (changes) {
      const newStepChanges = { ...stepChanges, [step]: changes };
      setStepChanges(newStepChanges);
      
      // Apply changes to dataset and propagate forward
      applyDataPrepChanges(step, changes);
      
      // Clear any subsequent step changes since data has changed
      const stepOrder = ['missingValues', 'standardizeVariables', 'recodeVariables', 'compositeScores', 'removeColumns', 'fixDuplicates'];
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
        });
        setStepChanges(updatedStepChanges);
      }
    }
    
    // Mark step as completed
    const newCompletedSteps = { ...completedSteps };
    newCompletedSteps[step as keyof typeof completedSteps] = true;
    setCompletedSteps(newCompletedSteps);
    
    // Save completion status
    saveStepCompletion(step, true);
  };
  
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step, go to summary
      setCurrentStep(7);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkipToSummary = () => {
    setCurrentStep(7);
  };

  const handleNavigateToStep = (step: number) => {
    setCurrentStep(step);
  };
  
  const handleFinish = () => {
    setLoading(true);
    
    // Ensure all changes are properly saved before navigating
    const finalState = getCurrentDatasetState();
    console.log('Final dataset state before navigation:', finalState);
    
    setTimeout(() => {
      setLoading(false);
      navigate('/visualization');
    }, 1000);
  };
  
  const renderCurrentStep = () => {
    // Reordered step names: standardizeVariables moved before recodeVariables
    const stepNames = ['missingValues', 'standardizeVariables', 'recodeVariables', 'compositeScores', 'removeColumns', 'fixDuplicates'];
    
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
          <RecodeVariablesStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 4:
        return (
          <CompositeScoresStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 5:
        return (
          <RemoveColumnsStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 6:
        return (
          <DuplicatesStep 
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
    case 3: return "Recode Variables";
    case 4: return "Create Composite Scores";
    case 5: return "Remove Unused Columns";
    case 6: return "Fix Duplicates & Inconsistencies";
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
      return "Assign numeric codes to categorical variables for analysis.";
    case 4:
      return "Combine multiple related questions to create composite scores or indices.";
    case 5:
      return "Remove variables that are irrelevant or have too many missing values.";
    case 6:
      return "Find and fix duplicate entries and inconsistent values in your dataset.";
    default:
      return "";
  }
}

export default DataPreparation;

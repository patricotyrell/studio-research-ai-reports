import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StepIndicator from '@/components/StepIndicator';
import { Info } from 'lucide-react';
import MissingValuesStep from '@/components/data-prep/MissingValuesStep';
import RecodeVariablesStep from '@/components/data-prep/RecodeVariablesStep';
import CompositeScoresStep from '@/components/data-prep/CompositeScoresStep';
import StandardizeVariablesStep from '@/components/data-prep/StandardizeVariablesStep';
import RemoveColumnsStep from '@/components/data-prep/RemoveColumnsStep';
import DuplicatesStep from '@/components/data-prep/DuplicatesStep';
import DataPrepSummary from '@/components/DataPrepSummary';
import { saveStepCompletion, getCompletedSteps } from '@/utils/dataUtils';

const TOTAL_STEPS = 6;

const DataPreparation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(getCompletedSteps());
  const [loading, setLoading] = useState(false);
  
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
  }, [navigate]);

  const handleStepComplete = (step: string, autoApplied: boolean) => {
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
  
  const handleFinish = () => {
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      navigate('/visualization');
    }, 1000);
  };
  
  const renderCurrentStep = () => {
    const stepNames = ['missingValues', 'recodeVariables', 'compositeScores', 'standardizeVariables', 'removeColumns', 'fixDuplicates'];
    
    const commonProps = {
      onComplete: (autoApplied: boolean) => {
        handleStepComplete(stepNames[currentStep - 1], autoApplied);
        handleNext();
      },
      onNext: handleNext,
      onBack: handleBack,
      onSkipToSummary: handleSkipToSummary,
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
          <RecodeVariablesStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 3:
        return (
          <CompositeScoresStep 
            {...commonProps}
            showBackButton={true}
          />
        );
      case 4:
        return (
          <StandardizeVariablesStep 
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
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>Step {currentStep} of {TOTAL_STEPS}: {getStepTitle(currentStep)}</AlertTitle>
              <AlertDescription>
                {getStepDescription(currentStep)}
              </AlertDescription>
            </Alert>
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
    case 1: return "Handle Missing Values";
    case 2: return "Recode Variables";
    case 3: return "Create Composite Scores";
    case 4: return "Standardize Variable Names";
    case 5: return "Remove Unused Columns";
    case 6: return "Fix Duplicates & Inconsistencies";
    default: return "";
  }
}

function getStepDescription(step: number): string {
  switch (step) {
    case 1: 
      return "Missing values can bias your results. Choose how to handle variables with missing data.";
    case 2:
      return "Standardize your categorical variables and assign numeric codes for analysis.";
    case 3:
      return "Combine multiple related questions to create composite scores or indices.";
    case 4:
      return "Clean up variable names for clearer reporting and analysis.";
    case 5:
      return "Remove variables that are irrelevant or have too many missing values.";
    case 6:
      return "Find and fix duplicate entries and inconsistent values in your dataset.";
    default:
      return "";
  }
}

export default DataPreparation;

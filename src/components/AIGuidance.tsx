
import React from 'react';
import { AlertCircle, BrainCircuit, Check, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIGuidanceProps {
  title: string;
  description: string;
  onAutomatic: () => void;
  onManual: () => void;
  automaticDescription?: string;
  manualDescription?: string;
  actionInProgress?: boolean;
  icon?: React.ReactNode;
}

const AIGuidance: React.FC<AIGuidanceProps> = ({
  title,
  description,
  onAutomatic,
  onManual,
  automaticDescription = "Handle automatically using AI recommendations",
  manualDescription = "Review and select options manually",
  actionInProgress = false,
  icon = <BrainCircuit className="h-6 w-6 text-indigo-600" />
}) => {
  return (
    <Card className="mb-6 border-2 border-indigo-100">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <div>
          <CardTitle className="text-lg font-semibold text-indigo-700">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <BrainCircuit className="h-10 w-10 text-indigo-500 mb-3" />
              <h3 className="font-medium mb-2">AI Automatic</h3>
              <p className="text-sm text-gray-500">{automaticDescription}</p>
            </CardContent>
            <CardFooter className="flex justify-center pb-4">
              <Button 
                variant="default" 
                className="bg-indigo-600 hover:bg-indigo-700" 
                onClick={onAutomatic}
                disabled={actionInProgress}
              >
                Use AI Recommendation
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-gray-500 mb-3" />
              <h3 className="font-medium mb-2">Manual Review</h3>
              <p className="text-sm text-gray-500">{manualDescription}</p>
            </CardContent>
            <CardFooter className="flex justify-center pb-4">
              <Button 
                variant="outline" 
                onClick={onManual}
                disabled={actionInProgress}
              >
                Review Options Manually
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIGuidance;

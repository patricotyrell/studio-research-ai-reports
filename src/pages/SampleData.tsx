
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectNameDialog from '@/components/ProjectNameDialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart2, FileText, Users, Activity, ChevronRight, Download } from 'lucide-react';
import { createProject } from '@/utils/dataUtils';

type SampleDataset = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rows: number;
  columns: number;
  topics: string[];
};

const SampleData = () => {
  const navigate = useNavigate();
  const [selectedDataset, setSelectedDataset] = useState<SampleDataset | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  const sampleDatasets: SampleDataset[] = [
    {
      id: 'customer-satisfaction',
      name: 'Customer Satisfaction Survey',
      description: 'Feedback from 150 customers about product quality, service experience, and likelihood to recommend.',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      rows: 150,
      columns: 12,
      topics: ['Product Feedback', 'Customer Experience', 'NPS Score']
    },
    {
      id: 'employee-engagement',
      name: 'Employee Engagement Survey',
      description: 'Responses from 200 employees regarding workplace satisfaction, management effectiveness, and career development.',
      icon: <Activity className="h-8 w-8 text-green-600" />,
      rows: 200,
      columns: 15,
      topics: ['Job Satisfaction', 'Management Rating', 'Work-Life Balance']
    },
    {
      id: 'market-research',
      name: 'Market Research Study',
      description: 'Consumer preferences data from 300 participants across different demographics and product categories.',
      icon: <BarChart2 className="h-8 w-8 text-purple-600" />,
      rows: 300,
      columns: 18,
      topics: ['Consumer Preferences', 'Product Comparisons', 'Brand Perception']
    }
  ];

  const handleSelectDataset = (dataset: SampleDataset) => {
    setSelectedDataset(dataset);
    setShowProjectDialog(true);
  };

  const handleProjectCreate = (projectName: string) => {
    if (!selectedDataset) return;
    
    // Create a mock file info object similar to what would be generated from a real upload
    const fileInfo = {
      name: `${selectedDataset.name}.csv`,
      size: Math.floor(selectedDataset.rows * selectedDataset.columns * 20), // Approximate size
      type: 'text/csv',
      dateUploaded: new Date().toISOString(),
      rows: selectedDataset.rows,
      columns: selectedDataset.columns,
      id: selectedDataset.id
    };
    
    // Store the selected dataset info in localStorage
    localStorage.setItem('currentFile', JSON.stringify(fileInfo));
    localStorage.setItem('isSampleData', 'true');
    
    // Create and save the project
    createProject(projectName, fileInfo);
    
    toast.success('Sample dataset loaded successfully', {
      description: `"${projectName}" is ready for analysis`
    });
    
    setShowProjectDialog(false);
    // Navigate to the data overview page
    navigate('/data-overview');
  };
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-research-900 mb-2">Sample Datasets</h1>
            <p className="text-gray-600">
              Explore Research Studio features with these pre-loaded datasets. 
              Select any dataset to begin your analysis journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {sampleDatasets.map((dataset) => (
              <Card 
                key={dataset.id} 
                className="hover:shadow-md transition-shadow border-l-4 hover:border-l-research-600"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {dataset.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{dataset.name}</CardTitle>
                        <CardDescription className="text-sm">{dataset.description}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1"
                      onClick={() => {}}
                      disabled
                    >
                      <Download className="h-3 w-3" /> Dataset Info
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Rows</p>
                        <p className="font-medium">{dataset.rows}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Variables</p>
                        <p className="font-medium">{dataset.columns}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Topics</p>
                        <div className="flex flex-wrap gap-1">
                          {dataset.topics.map((topic, index) => (
                            <span 
                              key={index} 
                              className="inline-flex text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectDataset(dataset)}
                      className="bg-research-700 hover:bg-research-800"
                    >
                      Load Dataset <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-gray-700" />
              <div>
                <h3 className="font-semibold text-lg mb-1">About Sample Datasets</h3>
                <p className="text-gray-600 mb-2">
                  These datasets are designed to showcase Research Studio's capabilities. 
                  They contain realistic survey data with a mix of question types commonly found in research studies.
                </p>
                <p className="text-gray-600">
                  After selecting a dataset, you'll be guided through the same analysis workflow as if you had uploaded your own data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProjectNameDialog
        open={showProjectDialog}
        onConfirm={handleProjectCreate}
        title="Name Your Project"
        description="Give your research project a descriptive name to help you identify it later."
      />
    </DashboardLayout>
  );
};

export default SampleData;

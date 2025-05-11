
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Upload, Database } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDemo = user.role === 'demo';
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-research-900 mb-2">Welcome to Research Studio</h1>
        <p className="text-gray-600 mb-6">
          {isDemo 
            ? "You're using the demo account. Explore the platform with our sample data."
            : "Start a new project or continue working on an existing one."
          }
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-6 w-6 mr-2 text-research-700" />
                Upload Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Upload your CSV or Excel file to begin analysis.
              </p>
              <Button 
                className="w-full bg-research-700 hover:bg-research-800"
                onClick={() => navigate('/upload')}
              >
                Start New Project
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-6 w-6 mr-2 text-research-700" />
                Sample Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Try our platform with pre-loaded sample datasets.
              </p>
              <Button 
                className="w-full bg-research-700 hover:bg-research-800"
                onClick={() => navigate('/sample-data')}
              >
                Explore Sample Data
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-research-700" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Learn how to use Research Studio effectively.
              </p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open('/docs', '_blank')}
              >
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {!isDemo && (
          <div className="bg-research-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-research-900 mb-3">Account Status: {user.role === 'paid' ? 'Premium' : 'Free Trial'}</h2>
            <p className="text-gray-600 mb-4">
              {user.role === 'paid' 
                ? "You have full access to all Research Studio features." 
                : "You're currently on the free trial with limited uploads. Upgrade to unlock all features."
              }
            </p>
            {user.role !== 'paid' && (
              <Button className="bg-research-700 hover:bg-research-800">
                Upgrade to Premium
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

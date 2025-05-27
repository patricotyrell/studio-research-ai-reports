import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectNameDialog from '@/components/ProjectNameDialog';
import { FileText, Upload, Database, Edit, Trash2, Calendar, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { getCurrentProject, updateProjectName, getCurrentFile, getPastProjects, isDemoMode, clearDemoMode, switchToProject, deleteProject } from '@/utils/dataUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [pastProjects, setPastProjects] = useState<any[]>([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  
  // Check if user is logged in and load projects
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Clear demo mode if it's still active
    if (isDemoMode()) {
      clearDemoMode();
    }
    
    loadProjects();
  }, [navigate]);

  const loadProjects = () => {
    // Load current project
    const project = getCurrentProject();
    setCurrentProject(project);
    
    // Load past projects
    const projects = getPastProjects();
    setPastProjects(projects);
    
    console.log('Loaded current project:', project);
    console.log('Loaded past projects:', projects);
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDemo = user.role === 'demo';
  const currentFile = getCurrentFile();
  
  const handleRenameProject = (newName: string) => {
    updateProjectName(newName);
    setShowRenameDialog(false);
    loadProjects(); // Reload to get updated data
  };
  
  const handleContinueProject = () => {
    if (currentProject && currentFile) {
      navigate('/data-overview');
    }
  };

  const handleLoadProject = (project: any) => {
    // Use the new switchToProject function for complete isolation
    switchToProject(project);
    setCurrentProject(project);
    navigate('/data-overview');
  };

  const handleDeleteProject = (projectId: string) => {
    // Use the enhanced deleteProject function
    deleteProject(projectId);
    
    // Update local state
    const updatedProjects = pastProjects.filter(p => p.id !== projectId);
    setPastProjects(updatedProjects);
    
    // Clear current project if it was deleted
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(null);
    }
  };
  
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
        
        {/* Current Project Section - Only show for real projects */}
        {currentProject && !isDemoMode() && (
          <Card className="mb-6 bg-research-50 border-research-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-research-700" />
                  Current Project: {currentProject.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRenameDialog(true)}
                  className="text-research-700 hover:text-research-800"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Rename
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-2">
                    Created: {new Date(currentProject.createdAt).toLocaleDateString()}
                  </p>
                  {currentFile && (
                    <p className="text-sm text-gray-500">
                      {currentFile.rows} rows, {currentFile.columns} columns
                    </p>
                  )}
                </div>
                <Button 
                  className="bg-research-700 hover:bg-research-800"
                  onClick={handleContinueProject}
                >
                  Continue Project
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

        {/* Collapsible Projects Section - Only show for real projects */}
        {pastProjects.length > 0 && !isDemoMode() && (
          <Card className="mb-8">
            <CardContent className="p-0">
              <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <FolderOpen className="h-5 w-5 mr-3 text-research-700" />
                      <span className="text-lg font-semibold text-research-900">
                        📁 Projects ({pastProjects.length} total)
                      </span>
                    </div>
                    {isProjectsOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                    {pastProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-semibold text-research-900">{project.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(project.createdAt).toLocaleDateString()}
                            {project.fileData && (
                              <span className="ml-4">
                                {project.fileData.rows} rows, {project.fileData.columns} columns
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadProject(project)}
                          >
                            Open
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}
        
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
      
      <ProjectNameDialog
        open={showRenameDialog}
        onConfirm={handleRenameProject}
        defaultName={currentProject?.name || ''}
        title="Rename Project"
        description="Enter a new name for your project."
      />
    </DashboardLayout>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Upload, Database, FileText, BarChart2, 
  FileUp, LayoutDashboard, Settings, LogOut,
  Menu, X, ChartBar, FileBarChart
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged out successfully",
      description: "You've been logged out of Research Studio",
    });
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container-custom flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <svg 
                className="h-8 w-8 text-research-800" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M7 7H17M7 12H17M7 17H13" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-serif text-xl font-bold text-research-900">Research Studio</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Mobile Version */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="h-full w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="flex flex-col space-y-1">
                <SidebarItems isActive={isActive} setSidebarOpen={setSidebarOpen} />
              </nav>
            </div>
          </div>
        )}

        {/* Sidebar - Desktop Version */}
        <div className="hidden md:block w-64 border-r border-gray-200 p-4">
          <nav className="flex flex-col space-y-1">
            <SidebarItems isActive={isActive} setSidebarOpen={setSidebarOpen} />
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

interface SidebarItemsProps {
  isActive: (path: string) => boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarItems: React.FC<SidebarItemsProps> = ({ isActive, setSidebarOpen }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/upload', label: 'Upload Data', icon: <Upload size={18} /> },
    { path: '/data-overview', label: 'Data Overview', icon: <FileText size={18} /> },
    { path: '/data-preparation', label: 'Data Preparation', icon: <FileUp size={18} /> },
    { path: '/visualization', label: 'Visualization', icon: <ChartBar size={18} /> },
    { path: '/analysis', label: 'Analysis', icon: <BarChart2 size={18} /> },
    { path: '/report', label: 'Report', icon: <FileBarChart size={18} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {navItems.map((item) => (
        <Tooltip key={item.path} delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`justify-start ${isActive(item.path) ? "bg-research-100 text-research-900" : "text-gray-600"}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </>
  );
};

export default DashboardLayout;

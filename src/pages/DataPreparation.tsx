
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import StepIndicator from '@/components/StepIndicator';
import { Info, AlertCircle, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Sample data from previous steps
interface Variable {
  name: string;
  type: 'text' | 'categorical' | 'numeric' | 'date';
  missing: number;
  unique: number;
  example: string;
  missingHandling?: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore';
  coding?: { [key: string]: number } | null;
  selected?: boolean;
}

const DataPreparation = () => {
  const navigate = useNavigate();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [activeTab, setActiveTab] = useState("missing");
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
    
    // In a real app, we would retrieve the actual data from the server
    // For this demo, we'll generate synthetic variable data based on data overview
    generateSyntheticVariables();
  }, [navigate]);
  
  const generateSyntheticVariables = () => {
    // Generate synthetic variable data based on data overview
    const syntheticVariables: Variable[] = [
      { name: 'respondent_id', type: 'numeric', missing: 0, unique: 150, example: '1001', selected: true },
      { name: 'age', type: 'numeric', missing: 5, unique: 45, example: '32', selected: true, 
        missingHandling: 'mean' },
      { name: 'gender', type: 'categorical', missing: 2, unique: 3, example: 'Female', selected: true, 
        missingHandling: 'mode',
        coding: { 'Male': 0, 'Female': 1, 'Other': 2 } },
      { name: 'education', type: 'categorical', missing: 8, unique: 5, example: 'Bachelor\'s degree', selected: true, 
        missingHandling: 'mode',
        coding: { 'High School': 0, 'Associate\'s degree': 1, 'Bachelor\'s degree': 2, 'Master\'s degree': 3, 'Doctorate': 4 } },
      { name: 'satisfaction', type: 'numeric', missing: 0, unique: 10, example: '4', selected: true },
      { name: 'likelihood_to_recommend', type: 'numeric', missing: 3, unique: 10, example: '8', selected: true, 
        missingHandling: 'mean' },
      { name: 'feedback', type: 'text', missing: 45, unique: 95, example: 'The service was excellent', selected: false },
      { name: 'purchase_date', type: 'date', missing: 12, unique: 65, example: '2023-06-15', selected: false, 
        missingHandling: 'drop' },
      { name: 'product_category', type: 'categorical', missing: 0, unique: 6, example: 'Electronics', selected: true,
        coding: { 'Electronics': 0, 'Clothing': 1, 'Home & Kitchen': 2, 'Books': 3, 'Toys': 4, 'Beauty': 5 } },
      { name: 'price_paid', type: 'numeric', missing: 7, unique: 98, example: '299.99', selected: true, 
        missingHandling: 'mean' }
    ];
    
    setVariables(syntheticVariables);
  };
  
  const handleMissingValueStrategy = (varName: string, strategy: 'drop' | 'mean' | 'median' | 'mode' | 'zero' | 'ignore') => {
    setVariables(variables.map(v => 
      v.name === varName ? { ...v, missingHandling: strategy } : v
    ));
  };
  
  const handleCodingChange = (varName: string, category: string, value: string) => {
    setVariables(variables.map(v => {
      if (v.name === varName && v.coding) {
        return { 
          ...v, 
          coding: { ...v.coding, [category]: parseInt(value) } 
        };
      }
      return v;
    }));
  };
  
  const handleVariableSelection = (varName: string, selected: boolean) => {
    setVariables(variables.map(v => 
      v.name === varName ? { ...v, selected } : v
    ));
  };
  
  const handleContinue = () => {
    setLoading(true);
    
    // Store prepared variables data in localStorage for demo purposes
    // In a real app, this would be processed on a server
    localStorage.setItem('preparedVariables', JSON.stringify(variables));
    
    setTimeout(() => {
      setLoading(false);
      navigate('/analysis');
    }, 1500);
  };
  
  // Filter variables based on tab
  const missingVariables = variables.filter(v => v.missing > 0);
  const categoricalVariables = variables.filter(v => v.type === 'categorical');
  const textVariables = variables.filter(v => v.type === 'text');
  const selectableVariables = variables.filter(v => v.type !== 'text');
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={3} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Data Preparation</h1>
              <p className="text-gray-600">
                Prepare your data for analysis by handling missing values, coding variables, and selecting relevant features.
              </p>
            </div>
            <Button 
              className="bg-research-700 hover:bg-research-800"
              onClick={handleContinue}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue to Analysis'}
            </Button>
          </div>
          
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle>Data Preparation Guide</AlertTitle>
            <AlertDescription>
              This step ensures your data is ready for accurate analysis. Handle missing values, convert text categories to numeric codes, and select which variables to include.
            </AlertDescription>
          </Alert>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="missing">Missing Values</TabsTrigger>
              <TabsTrigger value="coding">Categorical Coding</TabsTrigger>
              <TabsTrigger value="text">Text Analysis</TabsTrigger>
              <TabsTrigger value="selection">Variable Selection</TabsTrigger>
            </TabsList>
            
            {/* Missing Values Tab */}
            <TabsContent value="missing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                    Handle Missing Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {missingVariables.length === 0 ? (
                    <div className="text-center py-10">
                      <Check className="h-12 w-12 mx-auto text-green-600 mb-3" />
                      <h3 className="text-xl font-semibold mb-2">No Missing Values</h3>
                      <p className="text-gray-500">Your dataset doesn't have any missing values. Good job!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variable</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Missing</TableHead>
                          <TableHead>Strategy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {missingVariables.map((variable) => (
                          <TableRow key={variable.name}>
                            <TableCell className="font-medium">{variable.name}</TableCell>
                            <TableCell>
                              <Badge className={
                                variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                                variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                                variable.type === 'text' ? "bg-blue-100 text-blue-800" :
                                "bg-orange-100 text-orange-800"
                              }>
                                {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {variable.missing} ({Math.round((variable.missing / 150) * 100)}%)
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={variable.missingHandling || 'ignore'} 
                                onValueChange={(value: any) => handleMissingValueStrategy(variable.name, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ignore">Ignore</SelectItem>
                                  <SelectItem value="drop">Drop rows</SelectItem>
                                  {variable.type === 'numeric' && (
                                    <>
                                      <SelectItem value="mean">Replace with mean</SelectItem>
                                      <SelectItem value="median">Replace with median</SelectItem>
                                      <SelectItem value="zero">Replace with zero</SelectItem>
                                    </>
                                  )}
                                  {variable.type === 'categorical' && (
                                    <SelectItem value="mode">Replace with most frequent</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Categorical Coding Tab */}
            <TabsContent value="coding">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Info className="h-5 w-5 mr-2" />
                    Categorical Variable Coding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoricalVariables.length === 0 ? (
                    <div className="text-center py-10">
                      <Info className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                      <h3 className="text-xl font-semibold mb-2">No Categorical Variables</h3>
                      <p className="text-gray-500">Your dataset doesn't contain any categorical variables.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {categoricalVariables.map((variable) => (
                        <div key={variable.name} className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-3">{variable.name}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {variable.coding && Object.entries(variable.coding).map(([category, value]) => (
                              <div key={category} className="flex items-center space-x-2">
                                <span className="w-1/2">{category}</span>
                                <span className="text-gray-500">=</span>
                                <Input 
                                  type="number" 
                                  className="w-20" 
                                  value={value} 
                                  onChange={(e) => handleCodingChange(variable.name, category, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-3">
                            These numeric codes will be used in statistical analysis while maintaining the original labels for reporting.
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Text Analysis Tab */}
            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Info className="h-5 w-5 mr-2" />
                    Text Response Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {textVariables.length === 0 ? (
                    <div className="text-center py-10">
                      <Info className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                      <h3 className="text-xl font-semibold mb-2">No Text Variables</h3>
                      <p className="text-gray-500">Your dataset doesn't contain any text variables for sentiment analysis.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {textVariables.map((variable) => (
                        <div key={variable.name} className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-2">{variable.name}</h3>
                          <p className="text-gray-600 mb-4">
                            This variable contains open text responses. Our system can analyze these to identify common themes.
                          </p>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">AI-Detected Themes</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-blue-100 text-blue-800">Customer Service</Badge>
                              <Badge className="bg-blue-100 text-blue-800">Product Quality</Badge>
                              <Badge className="bg-blue-100 text-blue-800">Pricing</Badge>
                              <Badge className="bg-blue-100 text-blue-800">Delivery Experience</Badge>
                              <Badge className="bg-blue-100 text-blue-800">Ease of Use</Badge>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Button variant="outline" className="mr-2">
                              Customize Theme Detection
                            </Button>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Premium feature: Customize AI detection parameters
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Variable Selection Tab */}
            <TabsContent value="selection">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Info className="h-5 w-5 mr-2" />
                    Select Variables for Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-gray-600">
                    Choose which variables you want to include in your analysis. We've pre-selected the ones that are most likely to be relevant.
                  </p>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Include</TableHead>
                        <TableHead>Variable</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Missing</TableHead>
                        <TableHead>Recommended For</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectableVariables.map((variable) => (
                        <TableRow key={variable.name}>
                          <TableCell>
                            <Checkbox 
                              id={`select-${variable.name}`}
                              checked={variable.selected}
                              onCheckedChange={(checked) => handleVariableSelection(variable.name, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{variable.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              variable.type === 'numeric' ? "bg-green-100 text-green-800" :
                              variable.type === 'categorical' ? "bg-purple-100 text-purple-800" :
                              "bg-orange-100 text-orange-800"
                            }>
                              {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {variable.missing > 0 ? (
                              <span className="text-amber-600">{variable.missing}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {variable.type === 'numeric' && (
                              <span>Means, correlations, t-tests</span>
                            )}
                            {variable.type === 'categorical' && (
                              <span>Grouping, chi-square tests</span>
                            )}
                            {variable.type === 'date' && (
                              <span>Time-series analysis</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataPreparation;

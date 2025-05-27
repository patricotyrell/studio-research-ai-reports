
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, FileText, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';

interface ReportItem {
  id: string;
  type: 'chart' | 'table' | 'analysis';
  title: string;
  content: any;
  caption?: string;
  addedAt: string;
  source: 'visualization' | 'analysis';
  data?: any;
}

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reportStyle, setReportStyle] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [reportSections, setReportSections] = useState({
    methods: true,
    results: true,
    interpretation: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportContent, setReportContent] = useState({
    methods: '',
    results: '',
    interpretation: '',
  });
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadReportItems();
  }, [navigate]);
  
  const loadReportItems = () => {
    const items: ReportItem[] = [];
    
    // Load chart data from visualization module
    const chartData = localStorage.getItem('chartData');
    if (chartData) {
      try {
        const parsed = JSON.parse(chartData);
        items.push({
          id: `chart-${Date.now()}`,
          type: 'chart',
          title: `${parsed.type} Chart: ${parsed.primaryVariable}${parsed.secondaryVariable ? ' vs ' + parsed.secondaryVariable : ''}`,
          content: parsed,
          caption: parsed.insights || 'Visualization created in the Visualization module',
          addedAt: new Date().toISOString(),
          source: 'visualization',
          data: parsed.data
        });
      } catch (e) {
        console.warn('Could not load chart data:', e);
      }
    }
    
    // Load analysis results
    const analysisResult = localStorage.getItem('analysisResult');
    if (analysisResult) {
      try {
        const parsed = JSON.parse(analysisResult);
        items.push({
          id: `analysis-${Date.now()}`,
          type: 'analysis',
          title: `Statistical Analysis: ${parsed.type}`,
          content: parsed,
          caption: parsed.interpretation || 'Statistical analysis performed in the Analysis module',
          addedAt: new Date().toISOString(),
          source: 'analysis'
        });
      } catch (e) {
        console.warn('Could not load analysis result:', e);
      }
    }
    
    // Load any previously saved report items
    const savedItems = localStorage.getItem('reportItems');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        // Merge with existing items, avoiding duplicates
        parsed.forEach((item: ReportItem) => {
          if (!items.find(existing => existing.id === item.id)) {
            items.push(item);
          }
        });
      } catch (e) {
        console.warn('Could not load saved report items:', e);
      }
    }
    
    setReportItems(items);
    // Save the merged items back to localStorage
    localStorage.setItem('reportItems', JSON.stringify(items));
  };
  
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Generate report content based on added items
      const hasItems = reportItems.length > 0;
      
      setReportContent({
        methods: hasItems 
          ? `Data analysis was performed using Research Studio. The dataset included ${reportItems.filter(item => item.type === 'chart').length} visualizations and ${reportItems.filter(item => item.type === 'analysis').length} statistical analyses. ${reportItems.map(item => {
              if (item.type === 'chart') {
                return `Data visualization was conducted using ${item.content.type} charts.`;
              } else if (item.type === 'analysis') {
                return `Statistical testing was performed using ${item.content.type}.`;
              }
              return '';
            }).join(' ')}`
          : 'No specific methodology can be reported as no analyses have been added to this report.',
        
        results: hasItems
          ? `The analysis revealed the following findings based on ${reportItems.length} components added to this report:\n\n${reportItems.map((item, index) => `${index + 1}. ${item.title}${item.caption ? ': ' + item.caption : ''}`).join('\n\n')}`
          : 'No results are available as no analyses have been added to this report.',
        
        interpretation: hasItems
          ? `Based on the analyses included in this report, the findings provide insights into the data patterns. ${reportItems.map(item => {
              if (item.content.interpretation) {
                return item.content.interpretation;
              }
              return '';
            }).filter(text => text).join(' ')}`
          : 'No interpretation can be provided as no analyses have been added to this report.',
      });
      
      setIsGenerating(false);
      setReportGenerated(true);
      
      toast({
        title: "Report generated",
        description: hasItems ? "Your report is ready to review and download" : "Report generated, but no content has been added yet",
      });
    }, 1500);
  };
  
  const downloadReport = () => {
    toast({
      title: "Report downloaded",
      description: "Your report has been downloaded as PDF",
    });
  };
  
  const toggleSection = (section: keyof typeof reportSections) => {
    setReportSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const removeReportItem = (itemId: string) => {
    const updatedItems = reportItems.filter(item => item.id !== itemId);
    setReportItems(updatedItems);
    localStorage.setItem('reportItems', JSON.stringify(updatedItems));
    
    // Also remove from individual storage if it's the current item
    const itemToRemove = reportItems.find(item => item.id === itemId);
    if (itemToRemove?.source === 'visualization') {
      localStorage.removeItem('chartData');
    } else if (itemToRemove?.source === 'analysis') {
      localStorage.removeItem('analysisResult');
    }
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your report",
    });
  };
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <StepIndicator 
          currentStep={6} 
          steps={['Upload', 'Overview', 'Preparation', 'Analysis', 'Visualization', 'Report']} 
        />
        
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-research-900 mb-2">Report Generation</h1>
              <p className="text-gray-600">
                Generate a professional research report with your added content.
              </p>
            </div>
            
            {reportGenerated && (
              <Button 
                onClick={downloadReport} 
                className="flex items-center gap-2 bg-research-700 hover:bg-research-800"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report settings */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Report Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-style">Report Style</Label>
                  <Select value={reportStyle} onValueChange={(val) => setReportStyle(val as 'apa' | 'mla' | 'chicago')}>
                    <SelectTrigger id="report-style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apa">APA Style</SelectItem>
                      <SelectItem value="mla">MLA Style</SelectItem>
                      <SelectItem value="chicago">Chicago Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Include Sections</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="methods" 
                      checked={reportSections.methods}
                      onCheckedChange={() => toggleSection('methods')}
                    />
                    <Label htmlFor="methods">Methods</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="results" 
                      checked={reportSections.results}
                      onCheckedChange={() => toggleSection('results')}
                    />
                    <Label htmlFor="results">Results</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="interpretation" 
                      checked={reportSections.interpretation}
                      onCheckedChange={() => toggleSection('interpretation')}
                    />
                    <Label htmlFor="interpretation">Interpretation</Label>
                  </div>
                </div>
                
                {/* Added Content Summary */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">Report Content ({reportItems.length} items)</Label>
                  {reportItems.length > 0 ? (
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {reportItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <span className="truncate block font-medium">{item.title}</span>
                            <span className="text-gray-500 capitalize">({item.source})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReportItem(item.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      No content added yet. Use "Add to Report" in Visualization or Analysis modules.
                    </p>
                  )}
                </div>
                
                {!reportGenerated ? (
                  <Button 
                    onClick={generateReport} 
                    className="w-full mt-4 bg-research-700 hover:bg-research-800"
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                ) : (
                  <Button 
                    onClick={generateReport}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Regenerate
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Report preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportGenerated ? (
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="space-y-6">
                      {reportItems.length === 0 ? (
                        <div className="py-12 text-center">
                          <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No results added yet</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            Go to the Visualization or Analysis modules and click 'Add to Report' to build your report.
                          </p>
                          <div className="flex gap-2 justify-center mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => navigate('/visualization')}
                            >
                              Go to Visualization
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => navigate('/analysis')}
                            >
                              Go to Analysis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {reportSections.methods && (
                            <div>
                              <h2 className="text-xl font-bold mb-2">Methods</h2>
                              <div className="text-gray-800 space-y-2">
                                {reportContent.methods.split('\n').map((paragraph, i) => (
                                  <p key={i}>{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {reportSections.results && (
                            <div>
                              <h2 className="text-xl font-bold mb-2">Results</h2>
                              <div className="text-gray-800 space-y-4">
                                {reportContent.results.split('\n').map((paragraph, i) => (
                                  <p key={i}>{paragraph}</p>
                                ))}
                                
                                {/* Display added report items */}
                                {reportItems.map((item, index) => (
                                  <div key={item.id} className="my-6 border rounded-md p-4 bg-gray-50">
                                    <p className="text-sm text-center mb-2 text-gray-500">
                                      Figure {index + 1}: {item.title}
                                    </p>
                                    {item.caption && (
                                      <p className="text-xs text-center text-gray-400 mb-2">
                                        {item.caption}
                                      </p>
                                    )}
                                    <div className="bg-white p-4 rounded border">
                                      {item.type === 'analysis' && item.content.testSummary ? (
                                        <div className="space-y-2">
                                          <p className="font-medium">{item.content.type}</p>
                                          <p className="text-sm">Test Statistic: {item.content.testSummary.statistic?.toFixed(3)}</p>
                                          <p className="text-sm">p-value: {item.content.testSummary.pValue < 0.001 ? '< 0.001' : item.content.testSummary.pValue?.toFixed(3)}</p>
                                          <p className="text-sm text-gray-600">{item.content.interpretation}</p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-600 text-center">
                                          [{item.type.charAt(0).toUpperCase() + item.type.slice(1)} content - {item.source} module]
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {reportSections.interpretation && (
                            <div>
                              <h2 className="text-xl font-bold mb-2">Interpretation</h2>
                              <div className="text-gray-800 space-y-2">
                                {reportContent.interpretation.split('\n').map((paragraph, i) => (
                                  <p key={i}>{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="edit" className="space-y-6">
                      {reportSections.methods && (
                        <div className="space-y-2">
                          <Label htmlFor="methods-text">Methods</Label>
                          <Textarea 
                            id="methods-text" 
                            value={reportContent.methods}
                            onChange={(e) => setReportContent(prev => ({
                              ...prev,
                              methods: e.target.value
                            }))}
                            rows={5}
                          />
                        </div>
                      )}
                      
                      {reportSections.results && (
                        <div className="space-y-2">
                          <Label htmlFor="results-text">Results</Label>
                          <Textarea 
                            id="results-text" 
                            value={reportContent.results}
                            onChange={(e) => setReportContent(prev => ({
                              ...prev,
                              results: e.target.value
                            }))}
                            rows={5}
                          />
                        </div>
                      )}
                      
                      {reportSections.interpretation && (
                        <div className="space-y-2">
                          <Label htmlFor="interpretation-text">Interpretation</Label>
                          <Textarea 
                            id="interpretation-text" 
                            value={reportContent.interpretation}
                            onChange={(e) => setReportContent(prev => ({
                              ...prev,
                              interpretation: e.target.value
                            }))}
                            rows={5}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg mb-2">No report generated yet</p>
                    <p className="text-sm max-w-md mx-auto">
                      Use the settings panel on the left to configure and generate your report.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Report;

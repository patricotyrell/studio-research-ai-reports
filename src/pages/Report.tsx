
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Download, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import StepIndicator from '@/components/StepIndicator';

interface AnalysisResult {
  type: string;
  description: string;
  pValue: number;
  significant: boolean;
  statistic: number;
  interpretation: string;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  groupBy: string;
  measure: string;
}

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [reportStyle, setReportStyle] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [reportSections, setReportSections] = useState({
    introduction: true,
    methods: true,
    results: true,
    discussion: true,
    references: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportContent, setReportContent] = useState({
    introduction: '',
    methods: '',
    results: '',
    discussion: '',
    references: '',
  });
  
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if analysis was completed
    const result = localStorage.getItem('analysisResult');
    if (!result) {
      navigate('/analysis');
      return;
    }
    setAnalysisResult(JSON.parse(result));
    
    // Check if visualization was completed
    const chartDataStr = localStorage.getItem('chartData');
    if (chartDataStr) {
      setChartData(JSON.parse(chartDataStr));
    }
  }, [navigate]);
  
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Generate synthetic report content based on analysis and chart data
      const groupVar = chartData?.groupBy || 'grouping variable';
      const outVar = chartData?.measure || 'outcome variable';
      
      // Create synthetic report content
      setReportContent({
        introduction: `This study aimed to explore the relationship between ${groupVar} and ${outVar} in survey respondents. Prior research has suggested that ${groupVar} can influence ${outVar} in various contexts, but limited research has examined this relationship in this particular setting. Understanding this relationship can provide valuable insights for improving customer satisfaction and business outcomes.`,
        
        methods: `Data was collected through an online survey distributed to customers who had made a purchase within the last 30 days. The survey included demographic questions, including ${groupVar}, as well as questions measuring ${outVar} on a scale from 1-10. A total of 112 participants completed the survey, with a response rate of 28%. Statistical analysis was performed using Research Studio, with ${analysisResult?.type || 'statistical tests'} used to determine the relationship between variables.`,
        
        results: `The analysis revealed ${analysisResult?.significant ? 'a significant' : 'no significant'} relationship between ${groupVar} and ${outVar} (${analysisResult?.type || 'statistical test'}, ${analysisResult?.statistic.toFixed(2) || 'statistic'}, p = ${analysisResult?.pValue.toFixed(3) || 'p-value'}). ${chartData?.groupBy === 'gender' ? 'Female respondents reported higher levels than male respondents.' : chartData?.groupBy === 'age_group' ? 'Younger respondents (18-34) showed significantly higher scores than older participants.' : 'Education level was positively correlated with the outcome measure.'}`,
        
        discussion: `The findings from this study indicate that ${groupVar} is indeed ${analysisResult?.significant ? 'a significant factor' : 'not a significant factor'} in determining ${outVar}. ${analysisResult?.significant ? 'This suggests that organizations should consider tailoring their approaches based on different ' + groupVar + ' groups to maximize ' + outVar + '.' : 'This suggests that organizations can apply uniform approaches across ' + groupVar + ' groups when seeking to improve ' + outVar + '.'}

The limitations of this study include its relatively small sample size and reliance on self-reported data. Future research should consider a larger sample size and potentially include additional variables that might mediate the relationship between ${groupVar} and ${outVar}.`,
        
        references: `
1. Smith, J. (2023). Survey methodology best practices. Journal of Research Methods, 42(3), 210-225.
2. Johnson, A., & Williams, P. (2022). Factors influencing customer satisfaction in retail environments. International Journal of Business Studies, 15(2), 189-204.
3. Research Studio. (2025). Data analysis platform for survey research. Retrieved from https://researchstudio.example.com
        `,
      });
      
      setIsGenerating(false);
      setReportGenerated(true);
      
      toast({
        title: "Report generated",
        description: "Your report is ready to review and download",
      });
    }, 2000);
  };
  
  const downloadReport = () => {
    // In a real app, we'd format the report properly and generate a PDF
    // For this demo, we'll just show a toast
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
  
  const renderChart = () => {
    if (!chartData || !chartData.data) return null;
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name={chartData.measure} fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
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
                Generate a professional research report based on your analysis and visualization.
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
          
          {analysisResult ? (
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
                        id="introduction" 
                        checked={reportSections.introduction} 
                        onCheckedChange={() => toggleSection('introduction')}
                      />
                      <Label htmlFor="introduction">Introduction</Label>
                    </div>
                    
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
                        id="discussion" 
                        checked={reportSections.discussion}
                        onCheckedChange={() => toggleSection('discussion')}
                      />
                      <Label htmlFor="discussion">Discussion</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="references" 
                        checked={reportSections.references}
                        onCheckedChange={() => toggleSection('references')}
                      />
                      <Label htmlFor="references">References</Label>
                    </div>
                  </div>
                  
                  {!reportGenerated ? (
                    <Button 
                      onClick={generateReport} 
                      className="w-full mt-2 bg-research-700 hover:bg-research-800"
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Report'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={generateReport}
                      className="w-full mt-2"
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
                        {reportSections.introduction && (
                          <div>
                            <h2 className="text-xl font-bold mb-2">Introduction</h2>
                            <div className="text-gray-800 space-y-2">
                              {reportContent.introduction.split('\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        
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
                              
                              {chartData && (
                                <div className="my-4 border rounded-md p-4 bg-gray-50">
                                  <p className="text-sm text-center mb-2 text-gray-500">
                                    Figure 1: {chartData.measure} by {chartData.groupBy}
                                  </p>
                                  {renderChart()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {reportSections.discussion && (
                          <div>
                            <h2 className="text-xl font-bold mb-2">Discussion</h2>
                            <div className="text-gray-800 space-y-2">
                              {reportContent.discussion.split('\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {reportSections.references && (
                          <div>
                            <h2 className="text-xl font-bold mb-2">References</h2>
                            <div className="text-gray-800 font-mono text-sm">
                              <pre className="whitespace-pre-wrap">{reportContent.references}</pre>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="edit" className="space-y-6">
                        {reportSections.introduction && (
                          <div className="space-y-2">
                            <Label htmlFor="introduction-text">Introduction</Label>
                            <Textarea 
                              id="introduction-text" 
                              value={reportContent.introduction}
                              onChange={(e) => setReportContent(prev => ({
                                ...prev,
                                introduction: e.target.value
                              }))}
                              rows={5}
                            />
                          </div>
                        )}
                        
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
                        
                        {reportSections.discussion && (
                          <div className="space-y-2">
                            <Label htmlFor="discussion-text">Discussion</Label>
                            <Textarea 
                              id="discussion-text" 
                              value={reportContent.discussion}
                              onChange={(e) => setReportContent(prev => ({
                                ...prev,
                                discussion: e.target.value
                              }))}
                              rows={5}
                            />
                          </div>
                        )}
                        
                        {reportSections.references && (
                          <div className="space-y-2">
                            <Label htmlFor="references-text">References</Label>
                            <Textarea 
                              id="references-text" 
                              value={reportContent.references}
                              onChange={(e) => setReportContent(prev => ({
                                ...prev,
                                references: e.target.value
                              }))}
                              rows={5}
                              className="font-mono"
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
          ) : (
            <Card>
              <CardContent className="py-12 text-center flex flex-col items-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                <p>No analysis results found. Please complete analysis first.</p>
                <Button 
                  onClick={() => navigate('/analysis')} 
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Report;

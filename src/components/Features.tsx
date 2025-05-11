
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChartBar, Upload, Settings } from "lucide-react";

const featuresData = [
  {
    icon: <Upload className="h-6 w-6 text-research-600" />,
    title: "Data Import",
    description: "Upload survey data from CSV files or collect responses with our built-in form builder.",
  },
  {
    icon: <Settings className="h-6 w-6 text-research-600" />,
    title: "Data Cleaning",
    description: "Automatically clean and prepare your data for analysis with intelligent preprocessing.",
  },
  {
    icon: <ChartBar className="h-6 w-6 text-research-600" />,
    title: "Statistical Analysis",
    description: "Run guided statistical tests with AI-powered explanations tailored to your research questions.",
  },
  {
    icon: <FileText className="h-6 w-6 text-research-600" />,
    title: "Report Generation",
    description: "Generate APA-style reports with visualizations and interpretation of your findings.",
  },
];

const Features = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-research-900 mb-4">
            All-In-One Research Platform
          </h2>
          <p className="text-lg text-gray-600">
            Research Studio eliminates the inefficiencies of traditional research workflows by combining all your tools in one place.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresData.map((feature, index) => (
            <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="mb-4 p-2 inline-flex items-center justify-center rounded-lg bg-research-100">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-serif">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

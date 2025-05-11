
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const workflowSteps = [
  {
    number: "01",
    title: "Upload Your Data",
    description: "Import data from CSV files or collect responses using our form builder. Supports various formats and integrations with popular survey tools.",
  },
  {
    number: "02",
    title: "Clean & Prepare",
    description: "Our system automatically detects and handles missing values, outliers, and helps you transform variables for analysis.",
  },
  {
    number: "03",
    title: "Analyze Results",
    description: "Run appropriate statistical tests guided by AI recommendations. Get clear explanations of what each analysis means for your research.",
  },
  {
    number: "04",
    title: "Generate Reports",
    description: "Create publication-ready reports with proper APA formatting, visualizations, and interpretations of your findings.",
  },
];

const Workflow = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-research-900 mb-4">
            Streamlined Research Process
          </h2>
          <p className="text-lg text-gray-600">
            Our intuitive workflow guides you through each step of the research process, eliminating guesswork and reducing errors.
          </p>
        </div>
        
        <div className="relative mt-20">
          {/* Process line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-research-100 hidden md:block" />
          
          <div className="space-y-24 relative">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className={`md:absolute md:top-0 md:w-1/2 ${index % 2 === 0 ? 'md:left-0 md:pr-12' : 'md:right-0 md:pl-12'} z-10`}>
                  <Card className="border-gray-200 shadow-md">
                    <CardContent className="p-6">
                      <div className="bg-research-700 text-white text-xs font-bold px-2.5 py-1 rounded-md inline-block mb-3">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-serif font-bold text-research-800 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Circle marker on timeline (only visible on md+ screens) */}
                <div className="hidden md:block absolute left-1/2 top-6 transform -translate-x-1/2 w-6 h-6 rounded-full bg-research-700 border-4 border-white z-20" />
                
                {/* Mobile version (only visible on sm screens) */}
                <div className="md:hidden">
                  <Card className="border-gray-200 shadow-md">
                    <CardContent className="p-6">
                      <div className="bg-research-700 text-white text-xs font-bold px-2.5 py-1 rounded-md inline-block mb-3">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-serif font-bold text-research-800 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;

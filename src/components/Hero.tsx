
import React from 'react';
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-research-950 leading-tight">
              Simplify Your Research Workflow
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Upload survey data, analyze results, and create professional reports
              all in one platform. Save time and eliminate errors in your research.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-research-700 hover:bg-research-800 text-white">
                Get Started for Free
              </Button>
              <Button size="lg" variant="outline" className="border-research-300 text-research-700">
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="relative">
              <div className="rounded-lg shadow-xl overflow-hidden border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Research data dashboard"
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium text-sm">Analysis Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

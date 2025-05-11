
import React from 'react';
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-16 bg-research-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-research-100 rounded-full transform translate-x-1/3 -translate-y-1/3 z-0"></div>
          <div className="absolute left-0 bottom-0 w-48 h-48 bg-research-50 rounded-full transform -translate-x-1/3 translate-y-1/3 z-0"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-research-900 mb-4">
                Ready to Transform Your Research Process?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join thousands of researchers who have streamlined their workflow with Research Studio. Get started for free today.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-research-700 hover:bg-research-800 text-white">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-research-300 text-research-700">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

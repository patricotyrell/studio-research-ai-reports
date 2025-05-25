
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageCircle, Mail, FileText, ExternalLink } from 'lucide-react';

const Support = () => {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-research-900 mb-6">Support & Help</h1>
        
        <div className="grid gap-6">
          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-research-700" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Get instant help from our support team during business hours.
                </p>
                <Button className="w-full bg-research-700 hover:bg-research-800">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-research-700" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Send us an email and we'll get back to you within 24 hours.
                </p>
                <Button variant="outline" className="w-full">
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-research-700" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Browse our comprehensive guides and tutorials.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-research-900 mb-2">How do I upload my data?</h3>
                  <p className="text-gray-600 text-sm">
                    You can upload CSV or Excel files by clicking the "Upload Data" button from your dashboard. 
                    Files should have headers in the first row for best results.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-research-900 mb-2">What file formats are supported?</h3>
                  <p className="text-gray-600 text-sm">
                    Research Studio supports CSV (.csv) and Excel (.xlsx, .xls) file formats. 
                    Make sure your data is properly formatted with column headers.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-research-900 mb-2">How do I upgrade my plan?</h3>
                  <p className="text-gray-600 text-sm">
                    Visit the "Subscription & Plan" section in your account menu to view available plans and upgrade options.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-research-900 mb-2">Is my data secure?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes, we use industry-standard encryption and security measures to protect your data. 
                    Your data is stored securely and never shared with third parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-research-900 mb-2">Business Hours</h4>
                  <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p className="text-gray-600">Saturday - Sunday: 10:00 AM - 4:00 PM EST</p>
                </div>
                <div>
                  <h4 className="font-semibold text-research-900 mb-2">Response Times</h4>
                  <p className="text-gray-600">Live Chat: Instant (during business hours)</p>
                  <p className="text-gray-600">Email: Within 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;

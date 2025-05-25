
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CreditCard, Check, Star, Zap } from 'lucide-react';

const Subscription = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlan = user.role === 'paid' ? 'Premium' : user.role === 'demo' ? 'Demo' : 'Free Trial';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-research-900 mb-6">Subscription & Plan</h1>
        
        <div className="grid gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-research-700" />
                  Current Plan
                </div>
                <Badge variant={currentPlan === 'Premium' ? 'default' : 'secondary'}>
                  {currentPlan}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {currentPlan === 'Premium' 
                    ? "You have full access to all Research Studio features."
                    : currentPlan === 'Demo'
                    ? "You're using the demo account with limited features."
                    : "You're currently on the free trial with limited uploads."
                  }
                </p>
                
                {currentPlan !== 'Premium' && (
                  <div className="bg-research-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-research-900 mb-2">Upgrade to Premium</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Get unlimited uploads, advanced analysis tools, and priority support.
                    </p>
                    <Button className="bg-research-700 hover:bg-research-800">
                      <Star className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={currentPlan === 'Free Trial' ? 'border-research-200' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Free Trial
                  {currentPlan === 'Free Trial' && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">$0<span className="text-sm font-normal text-gray-500">/month</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Up to 5 uploads</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Basic analysis tools</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Sample datasets</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Email support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className={currentPlan === 'Premium' ? 'border-research-500 bg-research-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    Premium
                    <Zap className="h-4 w-4 ml-1 text-yellow-500" />
                  </div>
                  {currentPlan === 'Premium' && (
                    <Badge>Current</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Unlimited uploads</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Advanced analysis tools</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Custom visualizations</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Priority support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Export capabilities</li>
                  </ul>
                  {currentPlan !== 'Premium' && (
                    <Button className="w-full bg-research-700 hover:bg-research-800 mt-4">
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing Information */}
          {currentPlan === 'Premium' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Next billing date:</span>
                    <span className="font-medium">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment method:</span>
                    <span className="font-medium">•••• •••• •••• 4242</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;

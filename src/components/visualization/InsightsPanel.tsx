
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

interface InsightsPanelProps {
  insights: string;
  onCopyInsights: () => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  onCopyInsights,
}) => {
  if (!insights) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AI Insights</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyInsights}
          className="flex items-center gap-1"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 p-4 rounded-md text-gray-700">
          {insights.split('\n').map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;

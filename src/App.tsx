
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SampleData from "./pages/SampleData";
import UploadData from "./pages/UploadData";
import DataOverview from "./pages/DataOverview";
import DataPreparation from "./pages/DataPreparation";
import Visualization from "./pages/Visualization";
import Analysis from "./pages/Analysis";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sample-data" element={<SampleData />} />
          <Route path="/upload" element={<UploadData />} />
          <Route path="/data-overview" element={<DataOverview />} />
          <Route path="/data-preparation" element={<DataPreparation />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/report" element={<Report />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/support" element={<Support />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

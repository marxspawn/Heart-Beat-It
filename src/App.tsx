import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";

const Index = lazy(() => import("./pages/Index"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const CaregiverView = lazy(() => import("./pages/CaregiverView"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center font-mono text-sm">
    Loading...
  </div>
);

const App = () => {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      toast.error("An error occurred. Please try again.");
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <HashRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/share" element={<SharePage />} />
                <Route path="/caregiver/:token" element={<CaregiverView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </AppErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;



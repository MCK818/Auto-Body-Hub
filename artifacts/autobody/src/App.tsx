import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

// Layouts
import PublicLayout from "@/components/PublicLayout";
import AdminLayout from "@/components/AdminLayout";

// Public Pages
import Home from "@/pages/Home";
import Track from "@/pages/Track";
import Claim from "@/pages/Claim";
import PublicParts from "@/pages/PublicParts";

// Admin Pages
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Clients from "@/pages/admin/Clients";
import ClientDetail from "@/pages/admin/ClientDetail";
import Vehicles from "@/pages/admin/Vehicles";
import VehicleDetail from "@/pages/admin/VehicleDetail";
import Checkins from "@/pages/admin/Checkins";
import CheckinDetail from "@/pages/admin/CheckinDetail";
import Parts from "@/pages/admin/Parts";
import Payments from "@/pages/admin/Payments";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth") === "true";
    setIsAuth(auth);
    if (!auth && location !== "/admin/login") {
      setLocation("/admin/login");
    }
  }, [location, setLocation]);

  if (isAuth === null) return null;
  if (!isAuth && location !== "/admin/login") return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={() => <PublicLayout><Home /></PublicLayout>} />
      <Route path="/track" component={() => <PublicLayout><Track /></PublicLayout>} />
      <Route path="/claim" component={() => <PublicLayout><Claim /></PublicLayout>} />
      <Route path="/parts" component={() => <PublicLayout><PublicParts /></PublicLayout>} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={Login} />
      
      <Route path="/admin">
        <AdminGuard>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </AdminGuard>
      </Route>
      
      <Route path="/admin/clients">
        <AdminGuard>
          <AdminLayout>
            <Clients />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/clients/:id">
        <AdminGuard>
          <AdminLayout>
            <ClientDetail />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/vehicles">
        <AdminGuard>
          <AdminLayout>
            <Vehicles />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/vehicles/:id">
        <AdminGuard>
          <AdminLayout>
            <VehicleDetail />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/checkins">
        <AdminGuard>
          <AdminLayout>
            <Checkins />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/checkins/:id">
        <AdminGuard>
          <AdminLayout>
            <CheckinDetail />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/parts">
        <AdminGuard>
          <AdminLayout>
            <Parts />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/admin/payments">
        <AdminGuard>
          <AdminLayout>
            <Payments />
          </AdminLayout>
        </AdminGuard>
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

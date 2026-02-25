import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Despesas from "./pages/Despesas";
import Vales from "./pages/Vales";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Componente para rotas públicas (como login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Rota Pública */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    {/* Rotas Privadas */}
    <Route
      path="/"
      element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }
    />
    <Route
      path="/pdv"
      element={
        <PrivateRoute>
          <PDV />
        </PrivateRoute>
      }
    />
    <Route
      path="/produtos"
      element={
        <PrivateRoute>
          <Produtos />
        </PrivateRoute>
      }
    />
    <Route
      path="/estoque"
      element={
        <PrivateRoute>
          <Estoque />
        </PrivateRoute>
      }
    />
    <Route
      path="/despesas"
      element={
        <PrivateRoute>
          <Despesas />
        </PrivateRoute>
      }
    />
    <Route
      path="/vales"
      element={
        <PrivateRoute>
          <Vales />
        </PrivateRoute>
      }
    />
    <Route
      path="/relatorios"
      element={
        <PrivateRoute>
          <Relatorios />
        </PrivateRoute>
      }
    />
    <Route
      path="/configuracoes"
      element={
        <PrivateRoute>
          <Configuracoes />
        </PrivateRoute>
      }
    />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

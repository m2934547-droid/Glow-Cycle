import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Tracker from "@/pages/tracker";
import Calendar from "@/pages/calendar";
import Wellness from "@/pages/wellness";
import Store from "@/pages/store";
import Cart from "@/pages/cart";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        
        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>
        <Route path="/tracker">
          <ProtectedRoute><Tracker /></ProtectedRoute>
        </Route>
        <Route path="/calendar">
          <ProtectedRoute><Calendar /></ProtectedRoute>
        </Route>
        <Route path="/wellness">
          <ProtectedRoute><Wellness /></ProtectedRoute>
        </Route>
        <Route path="/store">
          <ProtectedRoute><Store /></ProtectedRoute>
        </Route>
        <Route path="/cart">
          <ProtectedRoute><Cart /></ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute><Profile /></ProtectedRoute>
        </Route>
        
        {/* Admin Route */}
        <Route path="/admin">
          <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
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

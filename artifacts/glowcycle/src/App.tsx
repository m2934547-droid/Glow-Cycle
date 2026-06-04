import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { CartDrawerProvider } from "@/components/cart-drawer";

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
import AdminUsers from "@/pages/admin-users";
import AdminProducts from "@/pages/admin-products";
import AdminConsultants from "@/pages/admin-consultants";
import Consultants from "@/pages/consultants";
import Orders from "@/pages/orders";
import ForgotPassword from "@/pages/forgot-password";
import SignupVerify from "@/pages/signup-verify";
import ResetPasswordVerify from "@/pages/reset-password-verify";
import { Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import { Chatbot } from "@/components/chatbot";

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
        <Route path="/signup/verify" component={SignupVerify} />
        
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
        <Route path="/consultants">
          <ProtectedRoute><Consultants /></ProtectedRoute>
        </Route>
        <Route path="/orders">
          <ProtectedRoute><Orders /></ProtectedRoute>
        </Route>
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/verify" component={ResetPasswordVerify} />
        
        {/* Admin Routes */}
        <Route path="/admin">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>
        </Route>
        <Route path="/admin/products">
          <ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>
        </Route>
        <Route path="/admin/consultants">
          <ProtectedRoute requireAdmin><AdminConsultants /></ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      <Chatbot />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <CartDrawerProvider>
            <Router />
          </CartDrawerProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

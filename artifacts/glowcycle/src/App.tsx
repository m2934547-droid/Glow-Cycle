import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { CartDrawerProvider } from "@/components/cart-drawer";

const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Tracker = lazy(() => import("@/pages/tracker"));
const Calendar = lazy(() => import("@/pages/calendar"));
const Wellness = lazy(() => import("@/pages/wellness"));
const Store = lazy(() => import("@/pages/store"));
const StoreLocator = lazy(() => import("@/pages/store-locator"));
const Cart = lazy(() => import("@/pages/cart"));
const Profile = lazy(() => import("@/pages/profile"));
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminProducts = lazy(() => import("@/pages/admin-products"));
const AdminConsultants = lazy(() => import("@/pages/admin-consultants"));
const AdminTracking = lazy(() => import("@/pages/admin-tracking"));
const Consultants = lazy(() => import("@/pages/consultants"));
const Orders = lazy(() => import("@/pages/orders"));
const Tracking = lazy(() => import("@/pages/tracking"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const UpdatePassword = lazy(() => import("@/pages/update-password"));
const SignupVerify = lazy(() => import("@/pages/signup-verify"));
const ResetPasswordVerify = lazy(() => import("@/pages/reset-password-verify"));
import { Redirect } from "wouter";
const NotFound = lazy(() => import("@/pages/not-found"));
const Chatbot = lazy(() => import("@/components/chatbot").then((module) => ({ default: module.Chatbot })));

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
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4 py-16">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/15" />
              <div className="h-4 w-48 animate-pulse rounded-full bg-primary/10" />
              <div className="h-3 w-64 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        }
      >
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
          <Route path="/store-locator">
            <ProtectedRoute><StoreLocator /></ProtectedRoute>
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
          <Route path="/tracking/:orderId">
            <ProtectedRoute><Tracking /></ProtectedRoute>
          </Route>
          <Route path="/update-password">
            <ProtectedRoute><UpdatePassword /></ProtectedRoute>
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
          <Route path="/admin/tracking">
            <ProtectedRoute requireAdmin><AdminTracking /></ProtectedRoute>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Suspense>
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

import React, { useEffect, useRef, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../services/store";
import { Loader2, Fingerprint, ShieldCheck, Clock, LogOut, RefreshCw } from "lucide-react";
import { shadowDB } from "../services/dbService";

const ChatInterface = lazy(() => import("./ChatInterface"));
const Pricing = lazy(() => import("./Pricing"));
const Auth = lazy(() => import("./Auth"));
const Payment = lazy(() => import("./Payment"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const SecurityGate = lazy(() => import("./SecurityGate"));
const AffiliateDashboard = lazy(() => import("./AffiliateDashboard"));
const Dashboard = lazy(() => import("./Dashboard"));
const WorkspaceExplorer = lazy(() => import("./WorkspaceExplorer"));
const AssistantWidget = lazy(() => import("./AssistantWidget").then(m => ({ default: m.AssistantWidget })));
const MusicStudio = lazy(() => import("./MusicStudio").then(m => ({ default: m.MusicStudio })));

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatingRef = useRef(false);

  const {
    user,
    view,
    selectedPlan,
    billingCycle,
    authDefaultTab,
    isAffiliateRegistration,
    isCheckingStatus,
    dashboardAction,
    isAppLocked,
    setView,
    setUser,
    setBillingCycle,
    setSelectedPlan,
    setAuthDefaultTab,
    setIsAffiliateRegistration,
    setDashboardAction,
    setIsAppLocked,
    handleAuthSuccess,
    handleLogout,
    handleGuestAccess,
    handleAdminLogin,
    handleUpgradeRequest,
    handleStartAffiliate,
    checkStatusManual,
  } = useAppStore();

  const pathMapping: Record<string, string> = {
    dashboard: "/",
    chat: "/chat",
    pricing: "/pricing",
    auth: "/auth",
    payment: "/payment",
    admin: "/admin",
    workspace: "/workspace",
    affiliate: "/affiliate",
    widget: "/widget",
    music: "/music",
    pending_review: "/pending",
    blocked: "/blocked",
    loading: "/loading",
  };

  const pathMappingReverse: Record<string, string> = {
    "/": "dashboard",
    "/chat": "chat",
    "/pricing": "pricing",
    "/auth": "auth",
    "/payment": "payment",
    "/admin": "admin",
    "/workspace": "workspace",
    "/affiliate": "affiliate",
    "/widget": "widget",
    "/music": "music",
    "/pending": "pending_review",
    "/blocked": "blocked",
    "/loading": "loading",
  };

  // 1. URL as Single Source of Truth for view state updates
  useEffect(() => {
    const targetView = pathMappingReverse[location.pathname];
    if (targetView && targetView !== useAppStore.getState().view) {
      isNavigatingRef.current = true;
      useAppStore.setState({ view: targetView as any });
      setTimeout(() => { isNavigatingRef.current = false; }, 50);
    }
  }, [location.pathname]);

  // 2. React to Store view changes (only if it didn't originate from URL change)
  useEffect(() => {
    if (isNavigatingRef.current) return;
    const targetPath = pathMapping[view];
    if (targetPath && targetPath !== location.pathname) {
      navigate(targetPath, { replace: view === "loading" || view === "dashboard" });
    }
  }, [view, navigate, location.pathname]);

  const navigateToView = (newView: any) => {
    const targetPath = pathMapping[newView];
    if (targetPath) {
      navigate(targetPath);
    }
    useAppStore.setState({ view: newView });
  };

  const handleChatNavigation = (section: string) => {
    if (section === "vault") {
      setDashboardAction("open_vault");
      navigateToView("dashboard");
    } else if (section === "affiliate") {
      navigateToView("affiliate");
    } else if (section === "pricing") {
      handleUpgradeRequest();
    } else if (section === "nexus") {
      setDashboardAction("open_nexus");
      navigateToView("dashboard");
    } else if (section === "workspace") {
      navigateToView("workspace");
    } else if (section === "admin") {
      navigateToView("admin");
    } else if (section === "music") {
      navigateToView("music");
    }
  };

  const isAdminUser = user
    ? user.email === "TITO" ||
      user.email === "tito@shadow.com" ||
      user.email === "admin@shadow.com" ||
      user.email === "ahmed.atya.daif@gmail.com" ||
      (user.tier === "sovereign" && user.name.includes("تيتو"))
    : false;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center text-white font-['Cairo']">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-20 animate-pulse"></div>
          <div className="relative z-10 p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <Routes>
      <Route
        path="/loading"
        element={
          <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center text-white font-['Cairo']">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-20 animate-pulse"></div>
              <div className="relative z-10 p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <Fingerprint className="w-16 h-16 text-purple-500 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white/90 tracking-tighter mb-2">
              جاري استعادة الاتصال...
            </h1>
          </div>
        }
      />

      <Route
        path="/"
        element={
          user ? (
            isAppLocked ? (
              <SecurityGate
                user={user}
                onUnlock={() => setIsAppLocked(false)}
                onLogout={isAdminUser ? () => navigateToView("admin") : handleLogout}
              />
            ) : (
              <Dashboard
                user={user}
                initialAction={dashboardAction}
                onClearAction={() => setDashboardAction(null)}
                onOpenChat={() => navigateToView("chat")}
                onOpenAffiliate={() => navigateToView("affiliate")}
                onLogout={isAdminUser ? () => navigateToView("admin") : handleLogout}
                onUpgrade={handleUpgradeRequest}
                onStartAffiliate={handleStartAffiliate}
                onOpenWorkspace={() => navigateToView("workspace")}
              />
            )
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/chat"
        element={
          user ? (
            isAppLocked ? (
              <SecurityGate
                user={user}
                onUnlock={() => setIsAppLocked(false)}
                onLogout={isAdminUser ? () => navigateToView("admin") : handleLogout}
              />
            ) : (
              <div className="fixed inset-0 bg-transparent text-white font-['Cairo'] overflow-hidden">
                <ChatInterface
                  onBack={() => navigateToView("dashboard")}
                  onNavigateTo={handleChatNavigation}
                />
              </div>
            )
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/pricing"
        element={
          <Pricing
            onSelectPlan={(plan, cycle) => {
              setSelectedPlan(plan);
              if (cycle) setBillingCycle(cycle);
              setIsAffiliateRegistration(false);
              setAuthDefaultTab("register");
              navigateToView("auth");
            }}
            onTrialStart={handleGuestAccess}
            onAffiliateStart={() => {
              setIsAffiliateRegistration(true);
              setAuthDefaultTab("register");
              navigateToView("auth");
            }}
          />
        }
      />

      <Route
        path="/auth"
        element={
          <Auth
            selectedPlan={selectedPlan}
            defaultTab={authDefaultTab}
            isAffiliateRegistration={isAffiliateRegistration}
            billingCycle={billingCycle}
            onAuthSuccess={handleAuthSuccess}
            onAdminLogin={handleAdminLogin}
            onBack={() => navigateToView("pricing")}
          />
        }
      />

      <Route
        path="/payment"
        element={
          <Payment
            planId={selectedPlan}
            billingCycle={billingCycle}
            onSuccess={async (proof, finalCycle) => {
              if (user && user.email !== "GUEST") {
                const updatedUser = {
                  ...user,
                  paymentProof: proof,
                  status: "pending" as const,
                  subscriptionCycle: finalCycle,
                };
                try {
                  await shadowDB.saveProfile(updatedUser);
                  setUser(updatedUser);
                  navigateToView("pending_review");
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            onBack={() => navigateToView("auth")}
          />
        }
      />

      <Route
        path="/admin"
        element={
          <AdminDashboard
            onLogout={handleLogout}
            onSwitchToUserMode={() => navigateToView("dashboard")}
            onNavigateTo={(v) => navigateToView(v)}
          />
        }
      />

      <Route
        path="/workspace"
        element={
          user ? (
            <WorkspaceExplorer
              userId={user.email}
              onItemSelect={(item) => console.log("Selected item:", item)}
              onBack={() => navigateToView("dashboard")}
            />
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/affiliate"
        element={
          user ? (
            <AffiliateDashboard
              user={user}
              onBack={() => navigateToView("dashboard")}
              onUpdateUser={setUser}
            />
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/widget"
        element={
          user ? (
            <AssistantWidget
              user={user}
              onOpenApp={() => (window.location.search = "")}
            />
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/music"
        element={
          user ? (
            <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative z-50">
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button 
                  onClick={() => navigateToView("dashboard")}
                  className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-700 transition"
                >
                  العودة للوحة القيادة
                </button>
              </div>
              <MusicStudio />
            </div>
          ) : (
            <Navigate to="/pricing" replace />
          )
        }
      />

      <Route
        path="/pending"
        element={
          <div className="fixed inset-0 bg-transparent flex items-center justify-center p-6 font-['Cairo'] text-white">
            <div className="max-w-md w-full glass p-10 rounded-[40px] border border-amber-500/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black mb-3 text-white">جاري المراجعة</h2>
                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                  طلبك وصل للعمليات. <br />
                  يتم الآن مراجعة إيصال الدفع وتفعيل حسابك.
                  <span className="block mt-2 text-amber-400 font-bold text-xs">
                    متوسط وقت الانتظار: 10 دقائق
                  </span>
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={checkStatusManual}
                    disabled={isCheckingStatus}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    تحديث الحالة الآن
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> خروج مؤقت
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <Route
        path="/blocked"
        element={
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center text-center p-8 text-white font-['Cairo']">
            <div>
              <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-black mb-2">الحساب معلق</h1>
              <button
                onClick={() => navigateToView("pricing")}
                className="mt-8 px-6 py-3 bg-white/10 rounded-xl"
              >
                عودة
              </button>
            </div>
          </div>
        }
      />

      <Route path="*" element={<Navigate to={user ? "/" : "/pricing"} replace />} />
    </Routes>
    </Suspense>
  );
};

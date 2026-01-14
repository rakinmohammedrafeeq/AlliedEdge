import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstrumentationProvider } from "@/instrumentation";
import "./index.css";
import "./types/global.d.ts";

// Vite + some CJS deps (e.g. sockjs-client) still expect a Node-like `global`.
// Define it early to prevent `ReferenceError: global is not defined` at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = globalThis as any;
if (typeof _global.global === "undefined") {
  _global.global = _global;
}

// Lazy load route components for better code splitting
const Feed = lazy(() => import("./pages/Feed.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const SetupUsername = lazy(() => import("./pages/SetupUsername.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const PostDetail = lazy(() => import("./pages/PostDetail.tsx"));
const PostForm = lazy(() => import("./pages/PostForm.tsx"));
const MyPosts = lazy(() => import("./pages/MyPosts.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const AdminUserPosts = lazy(() => import("./pages/AdminUserPosts.tsx"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements.tsx"));
const Announcements = lazy(() => import("./pages/Announcements.tsx"));
const AnnouncementCreate = lazy(() => import("./pages/AnnouncementCreate.tsx"));
const AnnouncementEdit = lazy(() => import("./pages/AnnouncementEdit.tsx"));
const Chat = lazy(() => import("./pages/Chat.tsx"));
const ChatDashboard = lazy(() => import("./pages/ChatDashboard.tsx"));
const ChangeUsername = lazy(() => import("./pages/ChangeUsername.tsx"));
const ChangeUsernameError = lazy(() => import("./pages/ChangeUsernameError.tsx"));
const UserSearch = lazy(() => import("./pages/UserSearch.tsx"));
const Help = lazy(() => import("./pages/Help.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstrumentationProvider>
      <ThemeProvider>
        <AuthProvider>
          {/* Session-based auth: the backend sets/validates the JSESSIONID cookie; the frontend just sends cookies (credentials: 'include'). */}
          <BrowserRouter>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/setup-username" element={<SetupUsername />} />
                <Route path="/" element={<Feed />} />
                <Route path="/post/:id" element={<PostDetail />} />
                {/* Shareable public profile route */}
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/users/search" element={<UserSearch />} />
                <Route path="/help" element={<Help />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/change-username"
                  element={
                    <ProtectedRoute>
                      <ChangeUsername />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/change-username-error"
                  element={
                    <ProtectedRoute>
                      <ChangeUsernameError />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:userId"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chats"
                  element={
                    <ProtectedRoute>
                      <ChatDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts/new"
                  element={
                    <ProtectedRoute>
                      <PostForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts/edit/:id"
                  element={
                    <ProtectedRoute>
                      <PostForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/announcements/create"
                  element={
                    <ProtectedRoute>
                      <AnnouncementCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/myposts"
                  element={
                    <ProtectedRoute>
                      <MyPosts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/posts"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:userId/posts"
                  element={
                    <ProtectedRoute>
                      <AdminUserPosts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <ProtectedRoute>
                      <AdminAnnouncements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/announcements/edit/:id"
                  element={
                    <ProtectedRoute>
                      <AnnouncementEdit />
                    </ProtectedRoute>
                  }
                />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </InstrumentationProvider>
  </StrictMode>,
);

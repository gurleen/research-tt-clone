import { BrowserRouter, Route, Routes } from "react-router";
import { AdminAuthProvider } from "./admin/auth/AdminAuthProvider.tsx";
import { ProtectedRoute } from "./admin/components/ProtectedRoute.tsx";
import { AdminLayout } from "./admin/layout/AdminLayout.tsx";
import { DashboardPage } from "./admin/pages/DashboardPage.tsx";
import { LoginPage } from "./admin/pages/LoginPage.tsx";
import { VideoEditPage } from "./admin/pages/VideoEditPage.tsx";
import { VideosPage } from "./admin/pages/VideosPage.tsx";
import { StubContentPage } from "./admin/pages/StubContentPage.tsx";
import { ExperimentConfigPage } from "./admin/pages/ExperimentConfigPage.tsx";
import { HandoffSettingsPage } from "./admin/pages/HandoffSettingsPage.tsx";
import { FeedPage } from "./pages/FeedPage";
import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="videos/new" element={<VideoEditPage />} />
            <Route path="videos/:videoId" element={<VideoEditPage />} />
            <Route path="stub-content" element={<StubContentPage />} />
            <Route path="experiment-config" element={<ExperimentConfigPage />} />
            <Route path="handoff-settings" element={<HandoffSettingsPage />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;

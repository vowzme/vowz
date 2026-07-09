import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";

// Mock the heavy Dashboard page — we only care that the ProtectedRoute
// resolves and renders its child, not the internals.
vi.mock("@/pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-root">Dashboard Loaded</div>,
}));

// Mock Home so we don't pull in every landing-page dependency.
vi.mock("@/pages/Index", () => ({
  default: () => (
    <div data-testid="home-root">
      <IndexLink />
    </div>
  ),
}));

// Controllable auth mock.
const authState: { user: unknown; loading: boolean } = {
  user: { id: "test-user" },
  loading: false,
};
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import { useAuth } from "@/hooks/use-auth";

function IndexLink() {
  return <Link to="/dashboard">Go to dashboard</Link>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth() as { user: unknown; loading: boolean };
  if (loading) return <div data-testid="auth-loading">loading</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<div data-testid="auth-page">auth</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Dashboard routing regression", () => {
  beforeEach(() => {
    authState.user = { id: "test-user" };
    authState.loading = false;
  });

  it("loads dashboard after navigating from the homepage", async () => {
    renderAt("/");
    expect(screen.getByTestId("home-root")).toBeInTheDocument();

    // Click the SPA link — Router should navigate to /dashboard without a reload.
    await userEvent.click(screen.getByRole("link", { name: /go to dashboard/i }));

    await waitFor(() =>
      expect(screen.getByTestId("dashboard-root")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("home-root")).not.toBeInTheDocument();
  });

  it("loads dashboard directly on hard refresh (deep-link entry)", async () => {
    renderAt("/dashboard");
    await waitFor(() =>
      expect(screen.getByTestId("dashboard-root")).toBeInTheDocument(),
    );
  });

  it("shows loading state while auth is resolving on hard refresh", () => {
    authState.loading = true;
    authState.user = null;
    renderAt("/dashboard");
    expect(screen.getByTestId("auth-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-root")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /auth on hard refresh", async () => {
    authState.loading = false;
    authState.user = null;
    renderAt("/dashboard");
    await waitFor(() =>
      expect(screen.getByTestId("auth-page")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("dashboard-root")).not.toBeInTheDocument();
  });
});

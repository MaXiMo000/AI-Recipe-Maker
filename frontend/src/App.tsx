import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { GoogleAuthCallbackPage } from '@/pages/GoogleAuthCallbackPage';
import { GenerateRecipePage } from '@/pages/GenerateRecipePage';
import { RecipesPage } from '@/pages/RecipesPage';
import { RecipeDetailPage } from '@/pages/RecipeDetailPage';
import { MealPlansPage } from '@/pages/MealPlansPage';
import { MealPlanDetailPage } from '@/pages/MealPlanDetailPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { SearchPage } from '@/pages/SearchPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/google-auth" element={<GoogleAuthCallbackPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route
                path="/generate"
                element={
                  <ProtectedRoute>
                    <GenerateRecipePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <ProtectedRoute>
                    <RecipesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes/:id"
                element={
                  <ProtectedRoute>
                    <RecipeDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meal-plans"
                element={
                  <ProtectedRoute>
                    <MealPlansPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meal-plans/:id"
                element={
                  <ProtectedRoute>
                    <MealPlanDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nutrition"
                element={
                  <ProtectedRoute>
                    <NutritionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

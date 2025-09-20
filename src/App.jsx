import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'

import AuthPage from '@/pages/AuthPage'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/pages/HomePage'
import PredictPage from '@/pages/PredictPage'
import GamesPage from '@/pages/GamesPage'
import StatisticsPage from '@/pages/StatisticsPage'
import TopPage from '@/pages/TopPage'
import RulesPage from '@/pages/RulesPage'
import AdminPage from '@/pages/AdminPage'
import NotFoundPage from '@/pages/NotFoundPage'
import WelcomeMessage from '@/components/WelcomeMessage'
import AdminRoute from '@/components/AdminRoute'

import ForgotPassword from '@/pages/ForgotPassword'
import AuthReset from '@/pages/AuthReset'

function App() {
  const { session, loading } = useSupabaseAuth()
  const location = useLocation()

  if (loading) {
    return <WelcomeMessage />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <Helmet>
        <title>Prediction Game</title>
        <meta
          name="description"
          content="A modern sports prediction game with leaderboards and statistics."
        />
      </Helmet>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset" element={<AuthReset />} />

          {!session ? (
            <Route path="/" element={<AuthPage />} />
          ) : (
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="predict" element={<PredictPage />} />
              <Route path="games" element={<GamesPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="top" element={<TopPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>
          )}

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App

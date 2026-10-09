import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MuralVagas from './pages/MuralVagas';
import NovaDemanda from './pages/NovaDemanda';
import EditarDemanda from './pages/EditarDemanda';
import PainelContratante from './pages/PainelContratante';
import Configuracoes from './pages/Configuracoes';
import Curriculo from './pages/Curriculo';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<MuralVagas />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-senha" element={<Login />} />

          {/* RF-07: Guarda de Rota para Criação de Vagas (Restrito a Contratante e Ambos) */}
          <Route
            path="/demandas/nova"
            element={
              <ProtectedRoute rolesPermitidos={['contratante', 'ambos']}>
                <NovaDemanda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vagas/nova"
            element={
              <ProtectedRoute rolesPermitidos={['contratante', 'ambos']}>
                <NovaDemanda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/demandas/editar/:id"
            element={
              <ProtectedRoute rolesPermitidos={['contratante', 'ambos']}>
                <EditarDemanda />
              </ProtectedRoute>
            }
          />

          {/* RF-06: Guarda de Rota para Minhas Demandas (Privada para autenticados) */}
          <Route
            path="/minhas-demandas"
            element={
              <ProtectedRoute>
                <PainelContratante />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <PainelContratante />
              </ProtectedRoute>
            }
          />

          {/* RF-10: Tela de Configurações da Conta */}
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            }
          />

          {/* RF-09: Tela de Currículo (Restrito a Diarista e Ambos) */}
          <Route
            path="/curriculo"
            element={
              <ProtectedRoute rolesPermitidos={['diarista', 'ambos']}>
                <Curriculo />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

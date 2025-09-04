"use client";
import { useState, useEffect, useContext } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { AuthContext } from '../context/AuthContext'; // Importar el contexto de Auth

// --- NUEVO: Importar componentes de MUI para el modal ---
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Backdrop } from '@mui/material';

/**
 * Este componente wrapper soluciona los errores de hidratación y ahora también
 * renderiza el modal global de sesión expirada.
 */
export default function ClientLayoutWrapper({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  // --- NUEVO: Obtener estado y manejador del modal desde el contexto ---
  const { sessionExpiredModalOpen, handleModalCloseAndRedirect } = useContext(AuthContext);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <NavBar />
      <main className="flex-grow max-w-7xl mx-auto w-full p-4">
        {children}
      </main>
      <Footer />

      {/* --- NUEVO: Modal de Sesión Expirada --- */}
      <Dialog
        open={sessionExpiredModalOpen}
        aria-labelledby="session-expired-dialog-title"
        aria-describedby="session-expired-dialog-description"
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(3px)',
            },
          },
        }}
        PaperProps={{
            sx: {
                borderRadius: '12px',
                p: 2,
            }
        }}
      >
        <DialogTitle id="session-expired-dialog-title" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Sesión Expirada
        </DialogTitle>
        <DialogContent>
          <Typography id="session-expired-dialog-description" sx={{ textAlign: 'center' }}>
            Tu sesión ha finalizado. Por favor, vuelve a iniciar sesión para continuar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: '0 16px 16px' }}>
          <Button onClick={handleModalCloseAndRedirect} variant="contained" color="error" autoFocus>
            Volver a Iniciar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

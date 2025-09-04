"use client";
import React, { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importar useRouter
import API from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter(); // Instanciar el router

  // --- NUEVO: Estado para el modal de sesión expirada ---
  const [sessionExpiredModalOpen, setSessionExpiredModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch {
        localStorage.removeItem("userData");
      }
    }
    // Si no hay userData pero sí token, se podría validar el token aquí.
    // Esta parte se mantiene como estaba.

    setLoadingAuth(false);

    // --- NUEVO: Listener para el evento de sesión expirada ---
    const handleSessionExpired = () => {
      console.log("AuthContext: Evento 'sessionExpired' recibido. Abriendo modal.");
      logout(); // Llama a la función de logout para limpiar el estado y localStorage
      setSessionExpiredModalOpen(true);
    };

    window.addEventListener("sessionExpired", handleSessionExpired);

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", { email, password });
      const { token, userData } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const registerUser = async (payload) => {
    await API.post("/auth/register", payload);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUser(null);
  };

  // --- NUEVO: Función para que el modal redirija al login ---
  const handleModalCloseAndRedirect = () => {
    setSessionExpiredModalOpen(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        registerUser,
        loadingAuth,
        // --- NUEVO: Exponer el estado y la función del modal ---
        sessionExpiredModalOpen,
        handleModalCloseAndRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios"; // Keep axios for this direct call

export default function XCallbackPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Procesando X OAuth...");

  // This page (popup, potentially on loca.lt or similar for dev) needs to postMessage to the MAIN frontend origin
  const MAIN_FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7223/api';

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      const errorDescription = searchParams.get("error_description") || "Error durante la autenticación con X.";
      setMessage(errorDescription);
      if (window.opener) {
        window.opener.postMessage({ type: "social-login-error", message: errorDescription }, MAIN_FRONTEND_ORIGIN);
        window.close();
      }
      localStorage.removeItem("x_code_verifier"); // Clean up verifier on error
      return;
    }

    if (!code) {
      setMessage("No se recibió código de X.");
      if (window.opener) {
        window.opener.postMessage({ type: "social-login-error", message: "No se recibió código de X." }, MAIN_FRONTEND_ORIGIN);
        window.close();
      }
      localStorage.removeItem("x_code_verifier"); // Clean up verifier
      return;
    }

    const doExchange = async () => {
      const codeVerifier = localStorage.getItem("x_code_verifier");
      if (!codeVerifier) {
        setMessage("Error: No se encontró el code_verifier. El flujo de autenticación no puede continuar.");
        if (window.opener) {
          window.opener.postMessage({ type: "social-login-error", message: "No se encontró code_verifier." }, MAIN_FRONTEND_ORIGIN);
          window.close();
        }
        localStorage.removeItem("x_code_verifier"); // Ensure cleanup
        return;
      }

      try {
        const res = await axios.get(
          `${API_URL}/auth/x/callback?code=${code}&code_verifier=${codeVerifier}`
        );
        if (res.data && res.data.success) {
          setMessage("Login con X exitoso. Comunicando a la ventana principal...");
          if (window.opener) {
            window.opener.postMessage({
              type: "social-login-success",
              payload: { token: res.data.token, userData: res.data.userData }
            }, MAIN_FRONTEND_ORIGIN);
            window.close();
          } else {
            setMessage("Login exitoso, pero no se pudo comunicar con la ventana principal. Por favor, cierre esta ventana manualmente y revise la página de login.");
          }
        } else {
          const errorDetail = "Error en login con X: " + (res.data?.message || "Respuesta no exitosa del backend.");
          setMessage(errorDetail);
          if (window.opener) {
            window.opener.postMessage({ type: "social-login-error", message: errorDetail }, MAIN_FRONTEND_ORIGIN);
            window.close();
          }
        }
      } catch (err) {
        console.error("Error en X callback:", err);
        const errorDetail = "Error al comunicarse con el backend para el token de X.";
        setMessage(errorDetail);
        if (window.opener) {
          window.opener.postMessage({ type: "social-login-error", message: errorDetail }, MAIN_FRONTEND_ORIGIN);
          window.close();
        }
      } finally {
        localStorage.removeItem("x_code_verifier"); // Always remove after attempt
      }
    };
    doExchange();
  }, [searchParams, MAIN_FRONTEND_ORIGIN, API_URL]);

  return (
    <div className="max-w-md mx-auto p-4 bg-white mt-8 text-center">
      <p>{message}</p>
    </div>
  );
}

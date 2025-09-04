"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios"; // Keep axios for this direct call

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Procesando Google OAuth...");

  // This page (popup) needs to postMessage to the MAIN frontend origin
  const MAIN_FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  // The backend API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7223/api';


  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      const errorDescription = searchParams.get("error_description") || "Error durante la autenticación con Google.";
      setMessage(errorDescription);
      if (window.opener) {
        window.opener.postMessage({ type: "social-login-error", message: errorDescription }, MAIN_FRONTEND_ORIGIN);
        window.close();
      }
      return;
    }

    if (!code) {
      setMessage("No se recibió código de Google.");
      if (window.opener) {
        window.opener.postMessage({ type: "social-login-error", message: "No se recibió código de Google." }, MAIN_FRONTEND_ORIGIN);
        window.close();
      }
      return;
    }

    const doExchange = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/auth/google/callback?code=${code}`
        );
        if (res.data && res.data.success) {
          setMessage("Login con Google exitoso. Comunicando a la ventana principal...");
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
          const errorDetail = "Error en login con Google: " + (res.data?.message || "Respuesta no exitosa del backend.");
          setMessage(errorDetail);
            if (window.opener) {
            window.opener.postMessage({ type: "social-login-error", message: errorDetail }, MAIN_FRONTEND_ORIGIN);
            window.close();
          }
        }
      } catch (err) {
        console.error("Error en Google callback:", err);
        const errorDetail = "Error al comunicarse con el backend para el token de Google.";
        setMessage(errorDetail);
        if (window.opener) {
          window.opener.postMessage({ type: "social-login-error", message: errorDetail }, MAIN_FRONTEND_ORIGIN);
          window.close();
        }
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

"use client";
import { useState, useContext, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  IconButton,
  Divider,
  keyframes,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";

const GoogleColorIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    {...props}
    width="30px"
    height="30px"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const milagroGreen = "#009246";
const milagroRed = "#ED1C24";

const slideUpFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

function generateCodeVerifier() {
  const array = new Uint32Array(28);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).slice(-2)).join("");
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const socialLoginWindowRef = useRef(null);
  const FRONTEND_URL =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  // Este useEffect maneja el mensaje si llegas a esta página desde una sesión expirada.
  useEffect(() => {
    if (searchParams.get("session_expired") === "true") {
      setErrorMsg("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const disableCopyPaste = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      if (res.data && res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userData", JSON.stringify(res.data.userData));
        setUser(res.data.userData);
        router.push("/");
      } else {
        // Este caso es para respuestas 200 OK pero con { success: false }
        setErrorMsg(
          res.data.message || "Credenciales inválidas o error en backend."
        );
      }
    } catch (err) {
      // Con el interceptor corregido, este bloque AHORA SÍ se ejecutará para errores 401 en esta página.
      let message = "Error al iniciar sesión. Por favor, intente de nuevo.";
      if (err.response?.data) {
        if (typeof err.response.data === 'object' && err.response.data.message) {
            message = err.response.data.message;
        }
        else if (typeof err.response.data === 'string') {
            message = err.response.data;
        }
      }
      setErrorMsg(message);
    }
  };

  useEffect(() => {
    const handleSocialLoginMessage = (event) => {
      if (event.origin !== FRONTEND_URL) {
        const isLocalDev = FRONTEND_URL.startsWith("http://localhost") && event.origin.startsWith("http://localhost");
        const isTunnel = event.origin.endsWith(".loca.lt");
        if (!isLocalDev && !isTunnel) {
          console.warn("Message received from unexpected origin:", event.origin, "Expected:", FRONTEND_URL);
          return;
        }
      }
      if (event.data?.type === "social-login-success") {
        const { token, userData } = event.data.payload;
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
        socialLoginWindowRef.current?.close();
        router.push("/");
      } else if (event.data?.type === "social-login-error") {
        setErrorMsg(event.data.message || "Social login failed.");
        socialLoginWindowRef.current?.close();
      }
    };
    window.addEventListener("message", handleSocialLoginMessage);
    return () => {
      window.removeEventListener("message", handleSocialLoginMessage);
      socialLoginWindowRef.current?.close();
    };
  }, [router, setUser, FRONTEND_URL]);

  const openSocialLoginPopup = (url) => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    socialLoginWindowRef.current?.close();
    socialLoginWindowRef.current = window.open(
      url,
      "socialLoginPopup",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
      scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, 
      height=${height}, top=${top}, left=${left}`
    );
  };

  const handleGoogleLogin = () => {
    const googleClientId = "1079549565952-p6ql47e90loihfo6rareiddsf60lq938.apps.googleusercontent.com";
    const googleRedirectUri = `${FRONTEND_URL}/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      googleRedirectUri
    )}&response_type=code&scope=openid%20email%20profile`;
    openSocialLoginPopup(googleAuthUrl);
  };

  const handleFacebookLogin = () => {
    const facebookClientId = "942915297819890";
    const facebookRedirectUri = `${FRONTEND_URL}/facebook/callback`;
    const facebookAuthUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${facebookClientId}&redirect_uri=${encodeURIComponent(
      facebookRedirectUri
    )}&response_type=code&scope=email,public_profile`;
    openSocialLoginPopup(facebookAuthUrl);
  };

  const handleXLogin = async () => {
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem("x_code_verifier", codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const xRedirectUri = process.env.NODE_ENV === "production"
        ? `${FRONTEND_URL}/x/callback`
        : "https://tired-rivers-pay.loca.lt";
    const xClientId = "al9Yd2VaM2ZqSVhVUjlIMEQzNjk6MTpjaQ";
    const scopes = "tweet.read users.read offline.access";
    const state = "state";
    const xAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${xClientId}&redirect_uri=${encodeURIComponent(
      xRedirectUri
    )}&scope=${encodeURIComponent(
      scopes
    )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    openSocialLoginPopup(xAuthUrl);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: "100%",
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: "16px",
          boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.12)",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(5px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          animation: `${slideUpFadeIn} 0.7s ease-out forwards`,
        }}
      >
        <CardContent>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography
              variant="h3"
              fontWeight="bold"
              textAlign="center"
              sx={{
                mb: 1,
                cursor: "pointer",
                color: milagroGreen,
                letterSpacing: "0.5px",
                transition: "color 0.3s ease-in-out",
                "&:hover": {
                  color: milagroRed,
                },
              }}
            >
              MiSgro
            </Typography>
          </Link>
          <Typography
            variant="h5"
            fontWeight="600"
            textAlign="center"
            sx={{
              mb: 3,
              color: "text.secondary",
            }}
          >
            Iniciar Sesión
          </Typography>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
              {errorMsg}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              onPaste={disableCopyPaste}
              onCopy={disableCopyPaste}
              onCut={disableCopyPaste}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              onPaste={disableCopyPaste}
              onCopy={disableCopyPaste}
              onCut={disableCopyPaste}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <Button
              variant="contained"
              type="submit"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: "8px",
                fontWeight: "bold",
                textTransform: "none",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                backgroundColor: milagroGreen,
                color: "#FFFFFF",
                transition:
                  "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
                "&:hover": {
                  backgroundColor: milagroRed,
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
          <Box sx={{ textAlign: "center", mt: 2.5, mb: 2.5 }}>
            <Typography variant="body2">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/register"
                style={{
                  textDecoration: "underline",
                  fontWeight: "500",
                  color: milagroGreen,
                  transition: "color 0.3s ease-in-out",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = milagroRed)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = milagroGreen)
                }
              >
                Regístrate
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Link
                href="/password"
                style={{
                  textDecoration: "underline",
                  fontWeight: "500",
                  color: milagroGreen,
                  transition: "color 0.3s ease-in-out",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = milagroRed)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = milagroGreen)
                }
              >
                ¿Cambiar o definir contraseña local?
              </Link>
            </Typography>
          </Box>
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              O inicia con
            </Typography>
          </Divider>
          <Box display="flex" justifyContent="center" gap={2.5}>
            <IconButton
              aria-label="google login"
              onClick={handleGoogleLogin}
              sx={{
                border: "1px solid #ddd",
                "&:hover": { bgcolor: "grey.100" },
                p: 0.8,
              }}
            >
              <GoogleColorIcon />
            </IconButton>
            <IconButton
              aria-label="facebook login"
              onClick={handleFacebookLogin}
              sx={{
                color: "#1877F2",
                border: "1px solid #ddd",
                "&:hover": { bgcolor: "grey.100" },
                p: 0.8,
              }}
            >
              <FacebookIcon sx={{ fontSize: "30px" }} />
            </IconButton>
            <IconButton
              aria-label="x login"
              onClick={handleXLogin}
              sx={{
                color: "#000000",
                border: "1px solid #ddd",
                "&:hover": { bgcolor: "grey.100" },
                p: 0.8,
              }}
            >
              <XIcon sx={{ fontSize: "30px" }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";

export default function PasswordPage() {
  const router = useRouter();

  // Etapas: 1 = pedir email, 2 = verificar código, 3 = cambiar contraseña
  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  // Flag para "demasiados intentos"
  const [tooManyAttempts, setTooManyAttempts] = useState(false);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("info");
  const openSnack = (msg, type = "info") => {
    setSnackMsg(msg);
    setSnackType(type);
    setSnackOpen(true);
  };
  const closeSnack = () => setSnackOpen(false);

  // 1) Enviar código
  const handleSendCode = async (e) => {
    e.preventDefault();
    openSnack("Enviando código...", "info");
    try {
      await axios.post("https://localhost:7223/api/auth/sendresetcode", { email });
      openSnack("Código enviado. Revisa tu correo.", "success");
      setStage(2);
    } catch (err) {
      if (err.response?.status === 404) {
        openSnack("No existe usuario con ese correo.", "error");
      } else if (err.response?.data) {
        openSnack(err.response.data, "error");
      } else {
        openSnack("Error al enviar código.", "error");
      }
    }
  };

  // 2) Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    openSnack("Verificando código...", "info");
    try {
      await axios.post("https://localhost:7223/api/auth/verifyresetcode", { email, code });
      openSnack("Código válido. Ahora ingresa tu nueva contraseña.", "success");
      setStage(3);
    } catch (err) {
      if (err.response?.data) {
        const msg = err.response.data;
        openSnack(msg, "error");
        if (msg.includes("Demasiados intentos") || msg.includes("5 veces")) {
          setTooManyAttempts(true);
        }
      } else {
        openSnack("Error al verificar código.", "error");
      }
    }
  };

  // 3) Cambiar contraseña
  const [success, setSuccess] = useState(false);
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password1 !== password2) {
      openSnack("Las contraseñas no coinciden.", "error");
      return;
    }
    openSnack("Cambiando contraseña...", "info");
    try {
      await axios.post("https://localhost:7223/api/auth/setlocalpassword", {
        email,
        newPassword: password1,
      });
      openSnack("¡Contraseña cambiada con éxito!", "success");
      setSuccess(true);
    } catch (err) {
      if (err.response?.data) {
        openSnack(err.response.data, "error");
      } else {
        openSnack("Error al cambiar la contraseña.", "error");
      }
    }
  };

  const goLogin = () => {
    router.push("/login");
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="shadow-md">
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Cambiar o Definir Contraseña Local
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: "gray" }}>
            Se enviará un código de verificación a tu correo. Tienes 2 minutos para usarlo.
            Máximo 5 intentos de código.
          </Typography>

          {stage === 1 && (
            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <Typography variant="body2" fontWeight="bold">
                Correo:
              </Typography>
              <TextField
                type="email"
                placeholder="Tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button variant="contained" color="primary" type="submit">
                Enviar código
              </Button>
            </form>
          )}

          {stage === 2 && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
              <Typography variant="body2" fontWeight="bold">
                Ingresa el código enviado a {email}:
              </Typography>
              <TextField
                placeholder="Código (6 dígitos)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              {!tooManyAttempts ? (
                <Button variant="contained" color="primary" type="submit">
                  Verificar código
                </Button>
              ) : (
                <Button variant="contained" color="success" onClick={goLogin}>
                  Iniciar Sesión
                </Button>
              )}
            </form>
          )}

          {stage === 3 && (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <Typography variant="body2" fontWeight="bold">
                Nueva Contraseña:
              </Typography>
              <TextField
                type="password"
                placeholder="Nueva contraseña"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                required
              />
              <Typography variant="body2" fontWeight="bold">
                Confirmar Contraseña:
              </Typography>
              <TextField
                type="password"
                placeholder="Repite la nueva contraseña"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
              {success ? (
                <Button variant="contained" color="success" onClick={goLogin}>
                  Iniciar Sesión
                </Button>
              ) : (
                <Button variant="contained" color="success" type="submit">
                  Cambiar Contraseña
                </Button>
              )}
            </form>
          )}

          <Box display="flex" justifyContent="center" mt={2}>
            <Button variant="outlined" color="primary" onClick={goLogin}>
              Volver
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snackType} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}

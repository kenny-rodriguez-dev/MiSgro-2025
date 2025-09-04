"use client";
import { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
/* MUI */
import {
  Alert,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  keyframes,
} from "@mui/material";

// Colores personalizados de la página de login
const milagroGreen = "#009246";
const milagroRed = "#ED1C24";

// Animación de la página de login
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

export default function RegisterPage() {
  const { registerUser } = useContext(AuthContext);
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  // Diálogo de éxito
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Impedir copiar/pegar/cortar en campos de contraseña
  const disableCopyPaste = (e) => e.preventDefault();

  const handleDialogClose = () => {
    setOpenSuccessDialog(false);
    router.push("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    try {
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        passwordHash: formData.password,
      });
      setSuccessMsg(
        "Usuario registrado con éxito. Revisa tu correo para confirmar."
      );
      setOpenSuccessDialog(true);
    } catch (error) {
      let msg = "Error al registrar usuario.";
      if (error.response && error.response.status === 400) {
        const resp = error.response.data;
        if (
          typeof resp === "string" &&
          resp.includes("email ya está registrado")
        ) {
          msg = "Ese correo ya está registrado, ingresa otro.";
        } else {
          msg = "Error: " + resp;
        }
      }
      setErrorMsg(msg);
    }
  };

  return (
    <Box
      sx={{
        height: "100%", // <-- CAMBIO 1: Ocupa el 100% del alto del <main>
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4, // <-- CAMBIO 2: Añade padding vertical para un mejor balance visual
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
            Registro de Usuario
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
              label="Nombre"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <TextField
              label="Apellido"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <TextField
              type="email"
              label="Correo electrónico"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              onCopy={disableCopyPaste}
              onPaste={disableCopyPaste}
              onCut={disableCopyPaste}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <TextField
              type="password"
              label="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              onCopy={disableCopyPaste}
              onPaste={disableCopyPaste}
              onCut={disableCopyPaste}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            />
            <TextField
              type="password"
              label="Confirmar Contraseña"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              onCopy={disableCopyPaste}
              onPaste={disableCopyPaste}
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
              Registrarme
            </Button>
          </Box>
          <Box sx={{ textAlign: "center", mt: 2.5 }}>
            <Typography variant="body2">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
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
                Inicia Sesión
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
      {/* Diálogo de éxito */}
      <Dialog open={openSuccessDialog} onClose={handleDialogClose}>
        <DialogTitle>Registro Exitoso</DialogTitle>
        <DialogContent>
          <Typography>{successMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="error" variant="contained">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

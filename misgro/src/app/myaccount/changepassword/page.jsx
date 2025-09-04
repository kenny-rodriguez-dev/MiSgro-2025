"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import API from "../../../services/api";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

export default function ChangePasswordPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackType, setSnackType] = useState("success");

  const showSnack = (msg, type = "success") => {
    setSnackMessage(msg);
    setSnackType(type);
    setOpenSnack(true);
  };
  const closeSnack = () => setOpenSnack(false);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.replace("/login");
    }
  }, [loadingAuth, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword1.trim() || !newPassword2.trim()) {
      showSnack("Completa todos los campos.", "error");
      return;
    }
    if (newPassword1 !== newPassword2) {
      showSnack("Las contraseñas nuevas no coinciden.", "error");
      return;
    }

    try {
      const res = await API.put("/auth/changepassword", {
        userId: user.id,
        oldPassword,
        newPassword: newPassword1,
        confirmPassword: newPassword2,
      });

      if (res.data && typeof res.data === "string") {
        showSnack(res.data, "success");
      } else {
        showSnack("Contraseña cambiada con éxito.", "success");
      }
      setOldPassword("");
      setNewPassword1("");
      setNewPassword2("");
    } catch (err) {
      if (typeof err.response?.data === "string") {
        showSnack(err.response.data, "error");
      } else {
        showSnack("Error al cambiar la contraseña.", "error");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 px-2">
      <Card className="shadow-md">
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Cambiar Contraseña
          </Typography>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextField
              label="Contraseña Actual"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              size="small"
            />
            <TextField
              label="Nueva Contraseña"
              type="password"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
              size="small"
            />
            <TextField
              label="Confirmar Nueva Contraseña"
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              size="small"
            />
            <Button type="submit" variant="contained" color="primary">
              Cambiar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={openSnack}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snackType} sx={{ width: "100%" }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

"use client";

import { Typography } from "@mui/material";

export default function PaymentMethods() {
  return (
    <div className="my-6 text-center">
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
        Métodos de Pago
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Tarjeta de Crédito, PayPal, Transferencia Bancaria, etc.
      </Typography>
      {/* Aquí podrías integrar pasarelas como Stripe o PayPal. */}
    </div>
  );
}

"use client";

import NextLink from "next/link";
import { Breadcrumbs, Link as MUILink, Typography } from "@mui/material";

export default function Breadcrumb({ items }) {
  return (
    <Breadcrumbs aria-label="breadcrumb" className="mb-4">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        if (isLast) {
          // Último => texto plano
          return (
            <Typography key={idx} color="text.primary" fontWeight="bold">
              {item.label}
            </Typography>
          );
        }
        return (
          <MUILink
            key={idx}
            component={NextLink}
            href={item.href}
            underline="hover"
            color="inherit"
          >
            {item.label}
          </MUILink>
        );
      })}
    </Breadcrumbs>
  );
}

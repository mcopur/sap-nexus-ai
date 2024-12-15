"use client"

import * as React from "react"
import { ThemeProvider as NextThemes } from "next-themes"

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  suppressHydrationWarning?: boolean;
}

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return <NextThemes {...props}>{children}</NextThemes>
}
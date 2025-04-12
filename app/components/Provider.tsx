"use client";

import { SessionProvider } from "next-auth/react";
import React, { type FC, type ReactNode } from "react";

interface ProviderProps {
  children: ReactNode;
}

const Provider: FC<ProviderProps> = ({ children }) => {
  // Force client-side re-render to ensure session is properly loaded
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {mounted ? children : null}
    </SessionProvider>
  );
};

export default Provider;

"use client";

import * as Toast from "@radix-ui/react-toast";
import { useState } from "react";

export const useToast = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = (msg: string) => {
    setMessage(msg);
    setOpen(true);
  };

  const ToastComponent = () => (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className="bg-red-500 text-white font-semibold rounded-lg px-4 py-2 shadow-md"
      >
        <Toast.Title className="text-sm">{message}</Toast.Title>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-4 right-4 z-50" />
    </Toast.Provider>
  );

  return { showToast, ToastComponent };
};

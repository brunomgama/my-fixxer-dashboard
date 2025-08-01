import { useRef } from "react";
import { ToasterRef } from "@/components/toast";

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const useToast = () => {
  const toasterRef = useRef<ToasterRef>(null);

  const showToast = (
    title: string,
    message: string,
    variant: "success" | "error" | "info" | "warning",
    position: Position = "top-right",
    duration: number = 5000
  ) => {
    toasterRef.current?.show({
      title,
      message,
      variant,
      position,
      duration,
    });
  };

  return { toasterRef, showToast };
};

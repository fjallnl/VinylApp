"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onError?: (message: string | null) => void;
}

export default function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setCameraError(null);
    onError?.(null);

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = "Camera access is not available in this browser.";
        setCameraError(message);
        onError?.(message);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      };

      try {
        await reader.decodeFromConstraints(constraints, videoRef.current!, (result, err) => {
          if (result) {
            onDetected(result.getText());
          }
        });
      } catch (error) {
        const message = getCameraErrorMessage(error);
        console.error("Barcode scanner error:", error);
        setCameraError(message);
        onError?.(message);
      }
    };

    startScanner();

    return () => {
      reader.reset();
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [onDetected, onError]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-900">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full aspect-video object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!cameraError ? (
          <div className="w-64 h-32 border-2 border-amber-400 rounded-lg opacity-80" />
        ) : (
          <div className="bg-black/70 p-4 rounded-lg text-center">
            <p className="text-xs text-red-300">{cameraError}</p>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400 py-2">Point camera at barcode</p>
    </div>
  );
}

function getCameraErrorMessage(error: unknown): string {
  if (!error) return "Unable to access the camera.";
  const message = (error as Error).name || (error as Error).message || String(error);
  if (message.includes("NotAllowedError") || message.includes("PermissionDeniedError")) {
    return "Camera permission was denied. Allow camera access in browser settings.";
  }
  if (message.includes("NotFoundError") || message.includes("OverconstrainedError") || message.includes("NoMediaDevices")) {
    return "No rear camera was found or it is unavailable.";
  }
  return "Unable to access the camera. Try Safari or enable camera permission.";
}

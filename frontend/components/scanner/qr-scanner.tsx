"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export function QrScanner({ onScan, isProcessing, disabled }: QrScannerProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });

  const scannerElementId = "qr-reader-container";

  // Stop scanning
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  }, []);

  // Start scanning
  const startScanner = useCallback(
    async (cameraId: string) => {
      if (!cameraId) return;

      try {
        setError(null);
        await stopScanner();

        const qrCodeInstance = new Html5Qrcode(scannerElementId);
        html5QrCodeRef.current = qrCodeInstance;

        await qrCodeInstance.start(
          cameraId,
          {
            fps: 12,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            const now = Date.now();
            // Prevent duplicate triggers within 2 seconds
            if (
              lastScannedRef.current.code === decodedText &&
              now - lastScannedRef.current.time < 2000
            ) {
              return;
            }

            lastScannedRef.current = { code: decodedText, time: now };
            onScan(decodedText);
          },
          () => {
            // Scan frame failure (normal while searching for QR)
          },
        );

        setIsScanning(true);

        // Check if torch/flashlight is supported
        try {
          const capabilities = qrCodeInstance.getRunningTrackCapabilities();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          } else {
            setHasTorch(false);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err) {
        console.error("Camera startup error:", err);
        setError(
          "Camera access was denied or device is currently unavailable. Please check browser permissions.",
        );
        setIsScanning(false);
      }
    },
    [onScan, stopScanner],
  );

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const newTorchState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced: [{ torch: newTorchState } as any],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.warn("Flashlight toggle error:", err);
    }
  };

  // Discover cameras on mount
  useEffect(() => {
    let isMounted = true;

    async function loadCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if found
          const backCamera = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment"),
          );
          const initialCameraId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCameraId(initialCameraId);
          startScanner(initialCameraId);
        } else {
          setError("No cameras detected on this device.");
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn("Unable to enumerate cameras:", err);
        setError("Camera permission requested. Please allow camera access in your browser.");
      }
    }

    loadCameras();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Viewfinder Window */}
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border-2 border-primary/40 bg-neutral-950 shadow-2xl">
        {/* HTML5 QR Container */}
        <div
          id={scannerElementId}
          className="h-full w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />

        {/* Viewfinder Corner Overlays */}
        <div className="pointer-events-none absolute inset-0 p-8 flex items-center justify-center">
          <div className="relative h-64 w-64">
            {/* Corners */}
            <div className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

            {/* Scanning Laser Line */}
            {isScanning && !isProcessing && (
              <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_var(--primary)] animate-pulse transition-all duration-1000" />
            )}
          </div>
        </div>

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs text-white z-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="mt-3 text-sm font-semibold tracking-wide">
              Verifying Ticket...
            </span>
          </div>
        )}

        {/* Error / Permission Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white z-20">
            <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
            <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">{error}</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => selectedCameraId && startScanner(selectedCameraId)}
              className="mt-4 gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Camera Toolbar & Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Camera Selector */}
        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedCameraId(newId);
              startScanner(newId);
            }}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={disabled || isProcessing}
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || `Camera ${c.id.slice(0, 5)}`}
              </option>
            ))}
          </select>
        )}

        {/* Play / Pause */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isScanning) {
              stopScanner();
            } else if (selectedCameraId) {
              startScanner(selectedCameraId);
            }
          }}
          disabled={disabled || isProcessing}
          className="gap-1.5 text-xs"
        >
          {isScanning ? (
            <>
              <CameraOff className="h-3.5 w-3.5" />
              Pause Scanner
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" />
              Resume Scanner
            </>
          )}
        </Button>

        {/* Flashlight */}
        {hasTorch && (
          <Button
            size="sm"
            variant={torchOn ? "default" : "outline"}
            onClick={toggleTorch}
            disabled={!isScanning || disabled || isProcessing}
            className="gap-1.5 text-xs"
          >
            {torchOn ? (
              <>
                <FlashlightOff className="h-3.5 w-3.5" />
                Torch On
              </>
            ) : (
              <>
                <Flashlight className="h-3.5 w-3.5" />
                Torch Off
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

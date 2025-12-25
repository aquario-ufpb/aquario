"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

type PhotoCropDialogProps = {
  open: boolean;
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
};

/**
 * Create a cropped image blob from the original image and crop area
 */
const createCroppedImage = async (imageSrc: string, cropArea: Area): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas size to the crop area size
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  // Draw the cropped area
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      0.95
    );
  });
};

export function PhotoCropDialog({ open, imageUrl, onCancel, onConfirm }: PhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage(imageUrl, croppedAreaPixels);
      onConfirm(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Ajuste o zoom e a posição da imagem. A área quadrada será usada como sua foto de perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[400px] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="flex items-center gap-4 px-2">
          <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[zoom]}
            onValueChange={(values: number[]) => setZoom(values[0])}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

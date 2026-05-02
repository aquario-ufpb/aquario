"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
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
import { toast } from "sonner";

type PhotoCropDialogProps = {
  open: boolean;
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
  /** Aspect ratio of the crop area (width / height). Default 1 (square). */
  aspect?: number;
  /** "round" for profile-style avatar; "rect" for banners/covers. Default "round". */
  cropShape?: "round" | "rect";
  /** Dialog title. */
  title?: string;
  /** Dialog description. */
  description?: string;
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

export function PhotoCropDialog({
  open,
  imageUrl,
  onCancel,
  onConfirm,
  aspect = 1,
  cropShape = "round",
  title = "Ajustar Foto de Perfil",
  description = "Ajuste o zoom e a posição da imagem. A área quadrada será usada como sua foto de perfil.",
}: PhotoCropDialogProps) {
  // For rectangular crops (banners, covers) we let the user zoom out below 1
  // and pan freely so the whole image can fit inside the crop frame.
  // Avatars stay fully covered (cover-style cropping).
  const isRect = cropShape === "rect";
  const minZoom = isRect ? 0.3 : 1;

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
    } catch {
      toast.error("Erro ao processar imagem. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[400px] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            minZoom={minZoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={isRect}
            objectFit={isRect ? "contain" : "cover"}
            restrictPosition={!isRect}
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
            min={minZoom}
            max={3}
            step={0.05}
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

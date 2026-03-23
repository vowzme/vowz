import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RotateCw, ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio?: number; // e.g. 1 for square, 16/9 for landscape
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropDialog({ open, onClose, imageSrc, aspectRatio = 1, onCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleApply = async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.x || 0) * scaleX,
      y: (completedCrop.y || 0) * scaleY,
      width: (completedCrop.width || 0) * scaleX,
      height: (completedCrop.height || 0) * scaleY,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] p-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Crop & Adjust Photo</DialogTitle>
          <DialogDescription className="font-body text-xs text-muted-foreground">
            Drag to reposition or resize the crop area. Click 'Apply' when done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative bg-muted rounded-lg overflow-hidden max-h-[50vh] flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-h-[50vh]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-h-[50vh] w-auto"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: "transform 0.2s",
                }}
                alt="Crop preview"
              />
            </ReactCrop>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate} title="Rotate 90°">
                <RotateCw className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-24"
                />
                <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button variant="gold" size="sm" onClick={handleApply}>
                <Check className="w-4 h-4 mr-1" /> Apply
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground font-body text-center">
            💡 Tip: Drag the crop handles to adjust. Use zoom and rotate for the perfect fit.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

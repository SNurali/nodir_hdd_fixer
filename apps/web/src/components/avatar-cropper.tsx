"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog } from '@headlessui/react';
import { X, ZoomIn, RotateCcw } from 'lucide-react';
import type { Point, Area } from 'react-easy-crop';

interface AvatarCropperProps {
    image: File | null;
    onCropComplete: (croppedBlob: Blob) => void;
    onClose: () => void;
}

export function AvatarCropper({ image, onCropComplete, onClose }: AvatarCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const onCropAreaComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0,
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5,
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(data, Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x), Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y));

        // Create circular avatar
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = pixelCrop.width;
        finalCanvas.height = pixelCrop.height;
        const finalCtx = finalCanvas.getContext('2d');

        if (!finalCtx) {
            return null;
        }

        // Draw circular mask
        finalCtx.beginPath();
        finalCtx.arc(
            pixelCrop.width / 2,
            pixelCrop.height / 2,
            pixelCrop.width / 2,
            0,
            2 * Math.PI,
        );
        finalCtx.closePath();
        finalCtx.clip();

        // Draw cropped image
        finalCtx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height);

        return new Promise((resolve) => {
            finalCanvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    resolve(null);
                }
            }, 'image/png', 0.95);
        });
    };

    const handleCropComplete = async () => {
        if (!croppedAreaPixels || !image) {
            return;
        }

        try {
            const imageUrl = URL.createObjectURL(image);
            const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
            URL.revokeObjectURL(imageUrl);

            if (croppedBlob) {
                onCropComplete(croppedBlob);
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    if (!image) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center"
        >
            <div className="fixed inset-0 bg-black/80" aria-hidden="true" />

            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Обрезка аватара
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="relative h-80 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4">
                    <Cropper
                        image={URL.createObjectURL(image)}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={true}
                        zoomWithScroll={true}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onRotationChange={onRotationChange}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>

                <div className="space-y-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ZoomIn size={16} className="text-gray-500" />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Приблизить
                            </label>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <RotateCcw size={16} className="text-gray-500" />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Поворот: {rotation}°
                            </label>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={rotation}
                            onChange={(e) => onRotationChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleCropComplete}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </Dialog>
    );
}

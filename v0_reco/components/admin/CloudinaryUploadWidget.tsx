import { useEffect, useRef, useState } from 'react';

interface CloudinaryUploadWidgetProps {
  onUpload: (result: CloudinaryUploadResult) => void;
  cloudName: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: { event: string; info: CloudinaryUploadResult }) => void
      ) => { open: () => void };
    };
  }
}

export default function CloudinaryUploadWidget({
  onUpload,
  cloudName,
  uploadPreset,
}: CloudinaryUploadWidgetProps) {
  const widgetRef = useRef<{ open: () => void } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the Cloudinary widget script
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;

    script.onload = () => {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFileSize: 10000000, // 10MB
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
          cropping: false,
          showSkipCropButton: true,
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#916A5D',
              tabIcon: '#916A5D',
              menuIcons: '#916A5D',
              textDark: '#000000',
              textLight: '#FFFFFF',
              link: '#916A5D',
              action: '#916A5D',
              inactiveTabIcon: '#A18278',
              error: '#A85454',
              inProgress: '#916A5D',
              complete: '#4A7A4A',
              sourceBg: '#FFFFFF',
            },
          },
        },
        (error, result) => {
          if (error) {
            setError(error.message);
            return;
          }
          if (result.event === 'success') {
            onUpload(result.info);
          }
        }
      );
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Failed to load Cloudinary widget');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [cloudName, uploadPreset, onUpload]);

  const handleClick = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  if (error) {
    return <div className="upload-error">{error}</div>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="upload-btn"
    >
      {isLoading ? 'Loading...' : 'Upload Image'}
    </button>
  );
}

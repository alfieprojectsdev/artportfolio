import { useEffect, useRef, useCallback } from 'react';
import { loadCloudinaryScript, type CloudinaryUploadResult } from '../../lib/cloudinary';

export type { CloudinaryUploadResult };

interface CloudinaryUploadWidgetProps {
  onUpload: (result: CloudinaryUploadResult) => void;
  cloudName: string;
  uploadPreset: string;
  id?: string; // Unique identifier for this widget instance
}

export default function CloudinaryUploadWidget({
  onUpload,
  cloudName,
  uploadPreset,
  id = 'default',
}: CloudinaryUploadWidgetProps) {
  const widgetRef = useRef<{ open: () => void; destroy: () => void } | null>(null);
  const onUploadRef = useRef(onUpload);
  const isReadyRef = useRef(false);

  // Keep callback ref updated without recreating widget
  useEffect(() => {
    onUploadRef.current = onUpload;
  }, [onUpload]);

  // Stable callback that uses the ref
  const handleUploadResult = useCallback((error: Error | null, result: { event: string; info: CloudinaryUploadResult }) => {
    if (error) {
      console.error('Cloudinary upload error:', error);
      return;
    }
    if (result.event === 'success') {
      onUploadRef.current(result.info);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    loadCloudinaryScript()
      .then(() => {
        if (!mounted) return;

        // Destroy previous widget if exists
        if (widgetRef.current) {
          widgetRef.current.destroy();
        }

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
          handleUploadResult
        );
        isReadyRef.current = true;
      })
      .catch((err) => {
        console.error('Failed to initialize Cloudinary widget:', err);
      });

    return () => {
      mounted = false;
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
      isReadyRef.current = false;
    };
  }, [cloudName, uploadPreset, id, handleUploadResult]);

  const handleClick = () => {
    if (widgetRef.current && isReadyRef.current) {
      widgetRef.current.open();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="upload-btn"
    >
      Upload Image
    </button>
  );
}

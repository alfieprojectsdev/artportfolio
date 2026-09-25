/**
 * Cloudinary helpers shared by the public page and the React islands.
 *
 * Client-safe: no env, no secrets. The URL helper runs during SSR; the script
 * loader only touches `window` when called, so importing this from an Astro
 * page is harmless.
 */

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: { event: string; info: CloudinaryUploadResult }) => void
      ) => { open: () => void; destroy: () => void };
    };
    cloudinaryScriptLoaded?: boolean;
    cloudinaryScriptLoading?: Promise<void>;
  }
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

const WIDGET_SRC = 'https://widget.cloudinary.com/v2.0/global/all.js';

/**
 * Load the upload widget script once per page, however many callers ask.
 *
 * The public page used to include this as a render-blocking <script> in
 * <head>, so every visitor waited on it before the hero drew, even while
 * commissions were closed and no upload button existed.
 */
export function loadCloudinaryScript(): Promise<void> {
  if (window.cloudinaryScriptLoaded) {
    return Promise.resolve();
  }

  if (window.cloudinaryScriptLoading) {
    return window.cloudinaryScriptLoading;
  }

  window.cloudinaryScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => {
      window.cloudinaryScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Cloudinary widget'));
    document.body.appendChild(script);
  });

  return window.cloudinaryScriptLoading;
}

/** One path segment of delivery params, e.g. `w_400,q_auto,f_auto`. */
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^,/]+(,[a-z]{1,3}_[^,/]+)*$/;

/**
 * Ask Cloudinary for a resized/re-encoded copy instead of the original upload.
 *
 * Returns the URL unchanged when it is not a Cloudinary upload URL (the
 * bundled `/assets/profile.jpg` fallback) or when it already carries delivery
 * params, so a stored thumbnail URL is never transformed twice.
 */
export function cloudinaryTransform(url: string, transform: string): string {
  const marker = '/upload/';
  const at = url.indexOf(marker);
  if (!url.startsWith('https://res.cloudinary.com/') || at === -1) {
    return url;
  }

  const rest = url.slice(at + marker.length);
  const firstSegment = rest.split('/')[0];
  if (TRANSFORM_SEGMENT.test(firstSegment)) {
    return url;
  }

  return `${url.slice(0, at + marker.length)}${transform}/${rest}`;
}

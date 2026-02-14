/**
 * Permission Manager - Handle browser permissions for camera, microphone, notifications, etc.
 */

interface PermissionStatus {
  camera: PermissionState | null;
  microphone: PermissionState | null;
  notification: PermissionState | null;
  geolocation: PermissionState | null;
}

export type PermissionType = 'camera' | 'microphone' | 'notification' | 'geolocation';

/**
 * Check camera permission status before requesting
 */
export async function checkCameraPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  try {
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state as 'granted' | 'denied' | 'prompt';
    }
  } catch (error) {
    console.warn('[PERMISSION] Cannot check camera status:', error);
  }
  return 'unknown';
}

/**
 * Request camera permission with proper pre-flight checks
 */
export async function requestCameraPermission(): Promise<{
  granted: boolean;
  error?: string;
}> {
  try {
    // Check if camera API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        granted: false,
        error: 'Camera API not supported on this browser. Please use Chrome, Firefox, Safari, or Edge.'
      };
    }

    // Check current permission status
    const status = await checkCameraPermissionStatus();
    
    if (status === 'denied') {
      return {
        granted: false,
        error: 'Camera permission was denied. Please enable it in your browser settings:\n\n' +
               '1. Click the camera icon or lock icon in the address bar\n' +
               '2. Find "Camera" and set to "Allow"\n' +
               '3. Refresh the page and try again'
      };
    }

    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      },
      audio: false
    });
    
    // Stop the stream after getting permission
    stream.getTracks().forEach(track => track.stop());
    console.log('[PERMISSION] Camera permission granted');
    
    return {
      granted: true
    };
  } catch (error: any) {
    console.error('[PERMISSION] Camera permission error:', error);
    
    let errorMessage = 'Camera access failed';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission was denied. Please enable it in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera device found on this device.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is being used by another application. Please close it and try again.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera does not support the requested specifications.';
    } else if (error.name === 'TypeError') {
      errorMessage = 'Camera permission request was cancelled.';
    }
    
    return {
      granted: false,
      error: errorMessage
    };
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream after getting permission
    stream.getTracks().forEach(track => track.stop());
    console.log('[PERMISSION] Microphone permission granted');
    return true;
  } catch (error) {
    console.error('[PERMISSION] Microphone permission denied:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[PERMISSION] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[PERMISSION] Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      if (granted) {
        console.log('[PERMISSION] Notification permission granted');
      }
      return granted;
    } catch (error) {
      console.error('[PERMISSION] Error requesting notification permission:', error);
      return false;
    }
  }

  console.warn('[PERMISSION] Notification permission was previously denied');
  return false;
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[PERMISSION] Geolocation not supported');
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        console.log('[PERMISSION] Geolocation permission granted');
        resolve(true);
      },
      (error) => {
        console.error('[PERMISSION] Geolocation permission denied:', error);
        resolve(false);
      }
    );
  });
}

/**
 * Request popup window permission (automatic on most browsers)
 */
export function allowPopup(url: string, windowName: string = '_blank', windowFeatures: string = 'width=800,height=600'): Window | null {
  try {
    const popup = window.open(url, windowName, windowFeatures);
    if (popup) {
      console.log('[PERMISSION] Popup window opened');
      return popup;
    } else {
      console.warn('[PERMISSION] Popup blocked - user may have popup blocking enabled');
      return null;
    }
  } catch (error) {
    console.error('[PERMISSION] Error opening popup:', error);
    return null;
  }
}

/**
 * Check current permission status
 */
export async function checkPermissionStatus(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    camera: null,
    microphone: null,
    notification: null,
    geolocation: null
  };

  try {
    // Check camera
    if ('permissions' in navigator) {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      status.camera = cameraStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking camera status:', error);
  }

  try {
    // Check microphone
    if ('permissions' in navigator) {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      status.microphone = micStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking microphone status:', error);
  }

  try {
    // Check notification
    if ('Notification' in window) {
      status.notification = Notification.permission as PermissionState;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking notification status:', error);
  }

  try {
    // Check geolocation
    if ('permissions' in navigator) {
      const geoStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      status.geolocation = geoStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking geolocation status:', error);
  }

  return status;
}

/**
 * Request all permissions
 */
export async function requestAllPermissions(): Promise<Record<string, boolean>> {
  const results = {
    camera: await requestCameraPermission(),
    microphone: await requestMicrophonePermission(),
    notification: await requestNotificationPermission(),
    geolocation: await requestGeolocationPermission(),
    popup: true // Popups are typically allowed by default
  };

  return results;
}

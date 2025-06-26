import { useState, useCallback } from "react";

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    microphone: false,
    remoteAccess: false,
  });

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((prev) => ({ ...prev, location: true }));
          resolve(true);
        },
        (error) => {
          let errorMessage = "Неизвестная ошибка геолокации";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Доступ к геолокации запрещен";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Информация о местоположении недоступна";
              break;
            case error.TIMEOUT:
              errorMessage = "Время ожидания запроса местоположения истекло";
              break;
            default:
              errorMessage = error.message || "Неизвестная ошибка геолокации";
              break;
          }

          console.error("Location permission denied:", errorMessage);
          setPermissions((prev) => ({ ...prev, location: false }));
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Останавливаем стрим после получения разрешения
      stream.getTracks().forEach((track) => track.stop());

      setPermissions((prev) => ({ ...prev, camera: true }));
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);
      setPermissions((prev) => ({ ...prev, camera: false }));
      return false;
    }
  }, []);

  const requestMicrophonePermission =
    useCallback(async (): Promise<boolean> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Останавливаем стрим после получения разрешения
        stream.getTracks().forEach((track) => track.stop());

        setPermissions((prev) => ({ ...prev, microphone: true }));
        return true;
      } catch (error) {
        console.error("Microphone permission denied:", error);
        setPermissions((prev) => ({ ...prev, microphone: false }));
        return false;
      }
    }, []);

  const setRemoteAccess = useCallback((allowed: boolean) => {
    setPermissions((prev) => ({ ...prev, remoteAccess: allowed }));
  }, []);

  return {
    permissions,
    requestLocationPermission,
    requestCameraPermission,
    requestMicrophonePermission,
    setRemoteAccess,
  };
};

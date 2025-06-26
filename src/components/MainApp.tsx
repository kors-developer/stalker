import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Settings,
  MapPin,
  Phone,
  UserCheck,
  Camera,
  Mic,
  CheckCircle,
} from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import { LiveStream } from "./LiveStream";
import { useLocation } from "@/hooks/useLocation";
import { sendLiveStreamNotification } from "@/services/webhookService";
import { updateUserLocation } from "@/services/databaseService";

interface MainAppProps {
  phoneNumber: string;
  consents: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
    remoteAccess: boolean;
  };
  onShowAdmin: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({
  phoneNumber,
  consents,
  onShowAdmin,
}) => {
  const { location, error: locationError } = useLocation(consents.location);

  // Отправляем уведомление о начале трансляции если есть согласие на камеру
  useEffect(() => {
    const sendStreamNotification = async () => {
      if (consents.camera) {
        console.log(
          "Sending live stream notification:",
          "🔴 SafeTrack Live Stream Started",
        );
        const streamUrl = `https://stream.safetrack.app/live/${phoneNumber.replace(/[\s\-\+\(\)]/g, "")}`;
        let message = `🔴 SafeTrack Live Stream Started\n📱 Телефон: ${phoneNumber}\n🕒 Время: ${new Date().toLocaleString("ru-RU")}\n📹 Прямая трансляция: ${streamUrl}`;

        if (location) {
          const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
          message += `\n📍 Местоположение: ${googleMapsUrl}`;
        }

        try {
          await sendLiveStreamNotification(
            phoneNumber,
            streamUrl,
            location || undefined,
          );
        } catch (error) {
          console.error("Live stream notification error:", error);
        }
      }
    };

    sendStreamNotification();
  }, [consents.camera, phoneNumber, location]);

  // Обновляем местоположение в базе данных
  useEffect(() => {
    if (location && consents.location) {
      updateUserLocation(phoneNumber, location.latitude, location.longitude);
    }
  }, [location, consents.location, phoneNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SafeTrack</h1>
              <p className="text-gray-600">
                Система безопасности - {phoneNumber}
              </p>
            </div>
          </div>

          <Button onClick={onShowAdmin} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Админ панель
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className={
              consents.location
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <MapPin
                  className={`h-5 w-5 ${consents.location ? "text-green-600" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-sm font-medium">Геолокация</p>
                  <p className="text-xs text-gray-600">
                    {consents.location ? "Активна" : "Отключена"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              consents.camera
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Camera
                  className={`h-5 w-5 ${consents.camera ? "text-green-600" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-sm font-medium">Камера</p>
                  <p className="text-xs text-gray-600">
                    {consents.camera ? "Активна" : "Отключена"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              consents.microphone
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Mic
                  className={`h-5 w-5 ${consents.microphone ? "text-green-600" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-sm font-medium">Микрофон</p>
                  <p className="text-xs text-gray-600">
                    {consents.microphone ? "Активен" : "Отключен"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              consents.remoteAccess
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Shield
                  className={`h-5 w-5 ${consents.remoteAccess ? "text-green-600" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-sm font-medium">Удаленный доступ</p>
                  <p className="text-xs text-gray-600">
                    {consents.remoteAccess ? "Разрешен" : "Запрещен"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geolocation Error Display */}
        {locationError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">
                    Ошибка геолокации
                  </h4>
                  <p className="text-sm text-red-800 mt-1">{locationError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Stream */}
          <LiveStream
            phoneNumber={phoneNumber}
            cameraConsent={consents.camera}
            locationConsent={consents.location}
            location={location}
          />

          {/* Location Info */}
          {location && consents.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span>Текущее местоположение</span>
                </CardTitle>
                <CardDescription>
                  Ваше местоположение отслеживается для безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Координаты:</p>
                  <p className="font-mono text-sm">
                    {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Местоположение активно отслеживается
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">
                  Система безопасности активна
                </h4>
                <p className="text-sm text-blue-800 mt-1">
                  SafeTrack мониторит ваше местоположение и обеспечивает
                  безопасность в соответствии с вашими настройками согласия. Все
                  данные обрабатываются конфиденциально.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

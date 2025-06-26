"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Loader2, Users } from "lucide-react"
import { StreamService } from "@/services/streamService"
import { toast } from "sonner"

interface LiveStreamProps {
  userId: string
  userName: string
  isEnabled?: boolean
}

export const LiveStream: React.FC<LiveStreamProps> = ({ userId, userName, isEnabled = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedAdmins, setConnectedAdmins] = useState(0)
  const streamServiceRef = useRef<StreamService | null>(null)

  useEffect(() => {
    if (isEnabled) {
      initializeStreamService()
    }

    return () => {
      cleanup()
    }
  }, [userId, isEnabled])

  const initializeStreamService = async () => {
    try {
      streamServiceRef.current = new StreamService(userId, false)
      await streamServiceRef.current.connect()
      toast.success("Готов к трансляции")
    } catch (error) {
      console.error("Failed to initialize stream service:", error)
      setError("Ошибка подключения к серверу")
    }
  }

  const startStream = async () => {
    if (!streamServiceRef.current) {
      toast.error("Сервис трансляции не инициализирован")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsStreaming(true)
      setIsLoading(false)
      toast.success("Трансляция началась")

      // Log stream start
      await fetch("/api/log-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "stream_started",
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (err) {
      console.error("Error starting stream:", err)
      setError("Не удалось получить доступ к камере")
      setIsLoading(false)
      toast.error("Ошибка доступа к камере")
    }
  }

  const stopStream = () => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopStream()
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setConnectedAdmins(0)
    toast.info("Трансляция остановлена")

    // Log stream stop
    fetch("/api/log-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action: "stream_stopped",
        timestamp: new Date().toISOString(),
      }),
    })
  }

  const cleanup = () => {
    if (streamServiceRef.current) {
      streamServiceRef.current.disconnect()
      streamServiceRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  if (!isEnabled) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5" />
            Трансляция отключена
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Функция трансляции недоступна. Обратитесь к администратору.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Прямая трансляция</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isStreaming ? "default" : "secondary"}>{isStreaming ? "В эфире" : "Не активна"}</Badge>
          {connectedAdmins > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {connectedAdmins}
            </Badge>
          )}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <CameraOff className="h-12 w-12 mb-2" />
              <p className="text-sm text-center">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-100">
                  <Camera className="h-12 w-12 mb-2" />
                  <p className="text-sm">Нажмите "Начать трансляцию"</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Пользователь: {userName}</div>
          <div className="flex gap-2">
            {!isStreaming ? (
              <Button onClick={startStream} disabled={isLoading} className="flex items-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Начать трансляцию
              </Button>
            ) : (
              <Button onClick={stopStream} variant="destructive" className="flex items-center gap-2">
                <CameraOff className="h-4 w-4" />
                Остановить
              </Button>
            )}
          </div>
        </div>

        {isStreaming && (
          <div className="text-xs text-gray-500 text-center">
            Ваша трансляция доступна администраторам для мониторинга
          </div>
        )}
      </CardContent>
    </Card>
  )
}

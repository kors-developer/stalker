"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface RemoteCameraProps {
  userId: string
  userName: string
  onStreamEnd?: () => void
}

export const RemoteCamera: React.FC<RemoteCameraProps> = ({ userId, userName, onStreamEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    initializeConnection()
    return () => {
      cleanup()
    }
  }, [userId])

  const initializeConnection = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Initialize WebSocket connection
      const ws = new WebSocket(`wss://your-websocket-server.com/admin/${userId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected for user:", userId)
        requestUserStream()
      }

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        await handleWebSocketMessage(data)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("Ошибка подключения к пользователю")
        setIsLoading(false)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Failed to initialize connection:", err)
      setError("Не удалось подключиться к камере пользователя")
      setIsLoading(false)
    }
  }

  const requestUserStream = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "request_stream",
          adminId: "admin_" + Date.now(),
          timestamp: Date.now(),
        }),
      )
    }
  }

  const handleWebSocketMessage = async (data: any) => {
    switch (data.type) {
      case "stream_offer":
        await handleStreamOffer(data.offer)
        break
      case "ice_candidate":
        await handleIceCandidate(data.candidate)
        break
      case "stream_started":
        setIsConnected(true)
        setIsLoading(false)
        toast.success(`Подключено к камере ${userName}`)
        break
      case "stream_ended":
        setIsConnected(false)
        toast.info(`Пользователь ${userName} завершил трансляцию`)
        onStreamEnd?.()
        break
      case "error":
        setError(data.message)
        setIsLoading(false)
        toast.error(`Ошибка: ${data.message}`)
        break
    }
  }

  const handleStreamOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      peerConnectionRef.current = peerConnection

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          setIsConnected(true)
          setIsLoading(false)
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "ice_candidate",
              candidate: event.candidate,
            }),
          )
        }
      }

      // Set remote description and create answer
      await peerConnection.setRemoteDescription(offer)
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // Send answer back
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "stream_answer",
            answer: answer,
          }),
        )
      }
    } catch (err) {
      console.error("Error handling stream offer:", err)
      setError("Ошибка при установке соединения")
      setIsLoading(false)
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate)
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err)
    }
  }

  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const reconnect = () => {
    cleanup()
    initializeConnection()
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Камера пользователя: {userName}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Подключено" : "Отключено"}</Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <CameraOff className="h-12 w-12 mb-2" />
              <p className="text-sm text-center">{error}</p>
              <Button onClick={reconnect} variant="outline" size="sm" className="mt-2">
                Переподключиться
              </Button>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="h-12 w-12 animate-spin mb-2" />
              <p className="text-sm">Подключение к камере...</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-100">
                  <Camera className="h-12 w-12 mb-2" />
                  <p className="text-sm">Ожидание видеопотока...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">ID пользователя: {userId}</div>
          <div className="flex gap-2">
            <Button onClick={reconnect} variant="outline" size="sm" disabled={isLoading}>
              Обновить
            </Button>
            <Button onClick={() => onStreamEnd?.()} variant="destructive" size="sm">
              Отключить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Users, Monitor, Settings } from "lucide-react"
import { RemoteCamera } from "./RemoteCamera"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  phone: string
  isOnline: boolean
  lastSeen: Date
  hasCamera: boolean
}

interface CameraControlsProps {
  isAdmin?: boolean
  users?: User[]
}

export const CameraControls: React.FC<CameraControlsProps> = ({ isAdmin = false, users = [] }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set())
  const [streamingMode, setStreamingMode] = useState<"single" | "multiple">("single")

  const onlineUsers = users.filter((user) => user.isOnline && user.hasCamera)

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    const user = users.find((u) => u.id === userId)
    if (user) {
      toast.info(`Подключение к камере ${user.name}...`)
    }
  }

  const handleStreamEnd = (userId: string) => {
    setActiveStreams((prev) => {
      const newStreams = new Set(prev)
      newStreams.delete(userId)
      return newStreams
    })

    if (selectedUserId === userId) {
      setSelectedUserId("")
    }
  }

  const addStream = (userId: string) => {
    if (streamingMode === "single") {
      setActiveStreams(new Set([userId]))
      setSelectedUserId(userId)
    } else {
      setActiveStreams((prev) => new Set([...prev, userId]))
    }
  }

  const removeAllStreams = () => {
    setActiveStreams(new Set())
    setSelectedUserId("")
    toast.info("Все потоки отключены")
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Управление камерой
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Эта функция доступна только администраторам</p>
          <Button disabled className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Недоступно
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Панель управления камерами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Пользователи онлайн: {onlineUsers.length}</span>
            </div>
            <Badge variant="outline">Активных потоков: {activeStreams.size}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Выбрать пользователя:</label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {onlineUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {user.name} ({user.phone})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Режим просмотра:</label>
              <Select value={streamingMode} onValueChange={(value: "single" | "multiple") => setStreamingMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Одна камера</SelectItem>
                  <SelectItem value="multiple">Несколько камер</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => selectedUserId && addStream(selectedUserId)}
              disabled={!selectedUserId || (streamingMode === "single" && activeStreams.size > 0)}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Подключить камеру
            </Button>
            <Button onClick={removeAllStreams} variant="destructive" disabled={activeStreams.size === 0}>
              Отключить все
            </Button>
          </div>

          {onlineUsers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет пользователей с доступными камерами</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Streams */}
      {activeStreams.size > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Активные потоки</h3>
          <div className={`grid gap-4 ${streamingMode === "multiple" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {Array.from(activeStreams).map((userId) => {
              const user = users.find((u) => u.id === userId)
              return user ? (
                <RemoteCamera
                  key={userId}
                  userId={userId}
                  userName={user.name}
                  onStreamEnd={() => handleStreamEnd(userId)}
                />
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

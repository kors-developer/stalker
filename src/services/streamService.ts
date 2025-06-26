export interface StreamMessage {
  type:
    | "request_stream"
    | "stream_offer"
    | "stream_answer"
    | "ice_candidate"
    | "stream_started"
    | "stream_ended"
    | "error"
  adminId?: string
  userId?: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  message?: string
  timestamp?: number
}

export class StreamService {
  private static instance: StreamService
  private connections: Map<string, WebSocket> = new Map()
  private ws: WebSocket | null = null
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private isAdmin = false
  private userId: string

  constructor(userId: string, isAdmin = false) {
    this.userId = userId
    this.isAdmin = isAdmin
  }

  static getInstance(userId: string, isAdmin = false): StreamService {
    if (!StreamService.instance) {
      StreamService.instance = new StreamService(userId, isAdmin)
    }
    return StreamService.instance
  }

  // Подключение к потоку пользователя (для админа)
  connectToUserStream(
    phoneNumber: string,
    onFrame: (frame: Blob) => void,
    onError: (error: string) => void,
  ): WebSocket | null {
    try {
      const cleanPhone = phoneNumber.replace(/[\s\-+$$$$]/g, "")
      const wsUrl = `wss://stream.safetrack.app/user/${cleanPhone}`

      // Закрываем существующее соединение если есть
      const existingWs = this.connections.get(cleanPhone)
      if (existingWs) {
        existingWs.close()
      }

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log(`Connected to user ${phoneNumber} stream`)
      }

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          onFrame(event.data)
        } else {
          try {
            const data: StreamMessage = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (e) {
            console.error("Error parsing WebSocket message:", e)
          }
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        onError("Ошибка подключения к камере пользователя")
      }

      ws.onclose = () => {
        console.log("WebSocket connection closed")
        this.connections.delete(cleanPhone)
      }

      this.connections.set(cleanPhone, ws)
      return ws
    } catch (error) {
      console.error("Failed to connect to user stream:", error)
      onError("Не удалось подключиться к камере пользователя")
      return null
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.isAdmin
          ? `wss://your-websocket-server.com/admin/${this.userId}`
          : `wss://your-websocket-server.com/user/${this.userId}`

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log("WebSocket connected")
          resolve()
        }

        this.ws.onmessage = (event) => {
          const data: StreamMessage = JSON.parse(event.data)
          this.handleMessage(data)
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("WebSocket disconnected")
          this.cleanup()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private async handleMessage(data: StreamMessage): Promise<void> {
    switch (data.type) {
      case "request_stream":
        if (!this.isAdmin) {
          await this.startUserStream(data.adminId!)
        }
        break

      case "stream_offer":
        if (this.isAdmin) {
          await this.handleStreamOffer(data.offer!)
        }
        break

      case "stream_answer":
        if (!this.isAdmin) {
          await this.handleStreamAnswer(data.answer!)
        }
        break

      case "ice_candidate":
        await this.handleIceCandidate(data.candidate!)
        break
    }
  }

  private async startUserStream(adminId: string): Promise<void> {
    try {
      // Get user's camera stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: "ice_candidate",
            candidate: event.candidate,
          })
        }
      }

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer to admin
      this.sendMessage({
        type: "stream_offer",
        offer: offer,
        userId: this.userId,
      })

      // Notify stream started
      this.sendMessage({
        type: "stream_started",
        userId: this.userId,
      })
    } catch (error) {
      console.error("Error starting user stream:", error)
      this.sendMessage({
        type: "error",
        message: "Не удалось получить доступ к камере",
      })
    }
  }

  private async handleStreamOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        this.peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
        })

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendMessage({
              type: "ice_candidate",
              candidate: event.candidate,
            })
          }
        }
      }

      await this.peerConnection.setRemoteDescription(offer)
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      this.sendMessage({
        type: "stream_answer",
        answer: answer,
      })
    } catch (error) {
      console.error("Error handling stream offer:", error)
    }
  }

  private async handleStreamAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(answer)
      }
    } catch (error) {
      console.error("Error handling stream answer:", error)
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(candidate)
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
    }
  }

  private sendMessage(message: StreamMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  // Отправка команды пользователю
  sendCommand(phoneNumber: string, command: string, data?: any): boolean {
    const cleanPhone = phoneNumber.replace(/[\s\-+$$$$]/g, "")
    const ws = this.connections.get(cleanPhone)

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: command,
          data: data,
          timestamp: Date.now(),
        }),
      )
      return true
    }

    return false
  }

  stopStream(): void {
    this.sendMessage({
      type: "stream_ended",
      userId: this.userId,
    })
    this.cleanup()
  }

  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Закрытие соединения
  disconnect(phoneNumber: string): void {
    const cleanPhone = phoneNumber.replace(/[\s\-+$$$$]/g, "")
    const ws = this.connections.get(cleanPhone)

    if (ws) {
      ws.close()
      this.connections.delete(cleanPhone)
    }
  }

  // Закрытие всех соединений
  disconnectAll(): void {
    this.connections.forEach((ws) => {
      ws.close()
    })
    this.connections.clear()
  }
}

// Singleton instance for managing streams
export const streamService = {
  createService: (userId: string, isAdmin = false) => {
    return new StreamService(userId, isAdmin)
  },
}

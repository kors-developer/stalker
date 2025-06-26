import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MapPin, Users, Eye, Lock, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUsers, saveAdminSession } from '@/services/databaseService';
import type { User } from '@/services/databaseService';

const ADMIN_PASSWORD = 'baksfly600';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      // Создаем токен сессии и сохраняем его
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await saveAdminSession(sessionToken);
      localStorage.setItem('admin_session_token', sessionToken);
      
      toast({
        title: "Доступ разрешен",
        description: "Добро пожаловать в админ-панель SafeTrack",
      });
      onLogin();
    } else {
      toast({
        title: "Доступ запрещен",
        description: "Неверный пароль. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-slate-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Админ доступ</CardTitle>
          <CardDescription>
            Введите пароль администратора для доступа к панели SafeTrack
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Пароль администратора
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль администратора"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password}
              size="lg"
            >
              {loading ? 'Проверка...' : 'Войти в панель'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: "Ссылка скопирована в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openStream = (streamUrl: string) => {
    window.open(streamUrl, '_blank');
  };

  const getLocationString = (user: User) => {
    if (!user.location) return 'Неизвестно';
    return `${user.location.latitude.toFixed(6)}, ${user.location.longitude.toFixed(6)}`;
  };

  const getStatus = (user: User) => {
    if (!user.last_seen) return { status: 'offline', text: 'неактивен' };
    
    const lastSeen = new Date(user.last_seen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return { status: 'active', text: 'активен' };
    if (diffMinutes < 30) return { status: 'idle', text: `${diffMinutes} мин назад` };
    return { status: 'offline', text: 'неактивен' };
  };

  const activeUsers = users.filter(user => {
    const status = getStatus(user);
    return status.status === 'active';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SafeTrack Админ</h1>
              <p className="text-gray-600">Панель мониторинга безопасности в реальном времени</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline">
            Выйти
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                Онлайн сейчас
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего зарегистрировано</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Пользователей в системе
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">С камерой</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.consents?.camera).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Доступна трансляция
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Map */}
          <Card>
            <CardHeader>
              <CardTitle>Карта пользователей в реальном времени</CardTitle>
              <CardDescription>
                Местоположения пользователей, давших согласие на отслеживание
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Интерактивная карта будет отображена здесь</p>
                  <p className="text-sm text-gray-500">
                    Показывает {users.filter(u => u.consents?.location && u.location).length} пользователей с геолокацией
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle>Зарегистрированные пользователи</CardTitle>
              <CardDescription>
                {loading ? 'Загрузка...' : `${users.length} пользователей в системе`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.length === 0 && !loading ? (
                  <div className="text-center text-gray-500 py-8">
                    Пользователи не найдены
                  </div>
                ) : (
                  users.map((user) => {
                    const status = getStatus(user);
                    const streamUrl = `https://stream.safetrack.app/live/${user.phone_number.replace(/[\s\-\+\(\)]/g, '')}`;
                    
                    return (
                      <div key={user.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{user.phone_number}</p>
                            <p className="text-xs text-gray-500">
                              {getLocationString(user)}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              status.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : status.status === 'idle'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {status.text}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {user.location && (
                            <>
                              <Button
                                onClick={() => openGoogleMaps(user.location!.latitude, user.location!.longitude)}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Карта
                              </Button>
                              <Button
                                onClick={() => copyToClipboard(`${user.location!.latitude}, ${user.location!.longitude}`)}
                                size="sm"
                                variant="outline"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          
                          {user.consents?.camera && (
                            <Button
                              onClick={() => openStream(streamUrl)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Стрим
                            </Button>
                          )}
                        </div>
                        
                        {user.consents?.camera && (
                          <div className="text-xs text-gray-500">
                            Трансляция: {streamUrl}
                            <Button
                              onClick={() => copyToClipboard(streamUrl)}
                              size="sm"
                              variant="ghost"
                              className="ml-1 h-4 w-4 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Соблюдение защиты данных</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Все мониторинговые активности выполняются с явного согласия пользователей. 
                  Пользователи могут отозвать согласие в любое время. Эта панель отображает только 
                  данные пользователей, которые активно дали согласие на услуги мониторинга.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

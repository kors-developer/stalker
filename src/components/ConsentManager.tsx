import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, MapPin, Camera, Mic, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { saveUser } from '@/services/databaseService';

interface ConsentManagerProps {
  onConsentComplete: (consents: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
    remoteAccess: boolean;
  }) => void;
  phoneNumber: string;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ onConsentComplete, phoneNumber }) => {
  const [consents, setConsents] = useState({
    location: false,
    camera: false,
    microphone: false,
    remoteAccess: false,
  });
  const [loading, setLoading] = useState(false);
  
  const { 
    permissions,
    requestLocationPermission,
    requestCameraPermission,
    requestMicrophonePermission,
    setRemoteAccess
  } = usePermissions();

  const handleConsentChange = async (consent: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({ ...prev, [consent]: checked }));
    
    if (checked) {
      let permissionGranted = false;
      
      switch (consent) {
        case 'location':
          permissionGranted = await requestLocationPermission();
          if (!permissionGranted) {
            setConsents(prev => ({ ...prev, [consent]: false }));
            toast({
              title: "Доступ к геолокации отклонен",
              description: "Разрешите доступ к местоположению в настройках браузера",
              variant: "destructive",
            });
          }
          break;
        case 'camera':
          permissionGranted = await requestCameraPermission();
          if (!permissionGranted) {
            setConsents(prev => ({ ...prev, [consent]: false }));
            toast({
              title: "Доступ к камере отклонен",
              description: "Разрешите доступ к камере в настройках браузера",
              variant: "destructive",
            });
          }
          break;
        case 'microphone':
          permissionGranted = await requestMicrophonePermission();
          if (!permissionGranted) {
            setConsents(prev => ({ ...prev, [consent]: false }));
            toast({
              title: "Доступ к микрофону отклонен",
              description: "Разрешите доступ к микрофону в настройках браузера",
              variant: "destructive",
            });
          }
          break;
        case 'remoteAccess':
          setRemoteAccess(checked);
          permissionGranted = true;
          break;
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Сохраняем пользователя в базу данных
      const result = await saveUser(phoneNumber, consents);
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка сохранения данных');
      }
      
      toast({
        title: "Настройки сохранены",
        description: "Добро пожаловать в SafeTrack!",
      });
      
      onConsentComplete(consents);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const consentItems = [
    {
      id: 'location',
      icon: MapPin,
      title: 'Доступ к геолокации',
      description: 'Разрешить отслеживание местоположения для функций безопасности',
      required: false,
    },
    {
      id: 'camera',
      icon: Camera,
      title: 'Доступ к камере',
      description: 'Разрешить использование камеры для фотосъемки и прямых трансляций',
      required: false,
    },
    {
      id: 'microphone',
      icon: Mic,
      title: 'Доступ к микрофону',
      description: 'Разрешить запись звука (опционально)',
      required: false,
    },
    {
      id: 'remoteAccess',
      icon: Eye,
      title: 'Удаленный мониторинг',
      description: 'Разрешить администраторам просматривать камеру в режиме реального времени',
      required: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Настройка разрешений</CardTitle>
          <CardDescription>
            Настройте разрешения для SafeTrack. Вы можете изменить их в любое время.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {consentItems.map((item) => {
            const Icon = item.icon;
            const isChecked = consents[item.id as keyof typeof consents];
            
            return (
              <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className={`p-2 rounded-full ${isChecked ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${isChecked ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleConsentChange(item.id as keyof typeof consents, checked as boolean)
                      }
                    />
                    <label htmlFor={item.id} className="font-medium text-gray-900 cursor-pointer">
                      {item.title}
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            );
          })}
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Защита данных</h4>
            <p className="text-sm text-blue-800">
              Все данные передаются в зашифрованном виде. Вы можете отозвать согласие в любое время. 
              Фоновое отслеживание происходит только с вашего явного разрешения.
            </p>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Продолжить'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

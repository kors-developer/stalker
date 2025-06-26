import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhoneRegistrationProps {
  onRegistrationComplete: (phoneNumber: string) => void;
}

export const PhoneRegistration: React.FC<PhoneRegistrationProps> = ({ onRegistrationComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Неверный номер телефона",
        description: "Пожалуйста, введите действительный номер телефона (минимум 10 цифр).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Имитация процесса регистрации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать в SafeTrack! Настройте разрешения.",
      });
      
      onRegistrationComplete(phoneNumber);
    } catch (error) {
      toast({
        title: "Ошибка регистрации",
        description: "Попробуйте еще раз или обратитесь в поддержку.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Добро пожаловать в SafeTrack</CardTitle>
          <CardDescription>
            Зарегистрируйте свой номер телефона для безопасного персонального мониторинга
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
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
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                Ваш номер телефона будет использоваться для идентификации и безопасной связи. 
                Регистрируясь, вы соглашаетесь с условиями использования и политикой конфиденциальности.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !phoneNumber}
              size="lg"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

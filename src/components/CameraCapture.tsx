import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useLocation } from '@/hooks/useLocation';
import { sendToWebhook } from '@/services/webhookService';
import { toast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  phoneNumber: string;
  cameraConsent: boolean;
  locationConsent: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  phoneNumber,
  cameraConsent,
  locationConsent,
}) => {
  const [uploading, setUploading] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  
  const { 
    videoRef, 
    isActive, 
    error: cameraError, 
    startCamera, 
    stopCamera, 
    capturePhoto 
  } = useCamera(cameraConsent);
  
  const { location, error: locationError } = useLocation(locationConsent);

  const handleCapture = async () => {
    if (!isActive) {
      toast({
        title: "Camera Not Active",
        description: "Please start the camera first.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const photoBlob = await capturePhoto();
      
      if (!photoBlob) {
        throw new Error('Failed to capture photo');
      }

      const result = await sendToWebhook(
        phoneNumber, 
        photoBlob, 
        location ? { latitude: location.latitude, longitude: location.longitude } : undefined
      );

      if (result.success) {
        setLastCapture(new Date().toLocaleString());
        toast({
          title: "Entry Logged",
          description: "Photo and information have been securely transmitted.",
        });
        
        // Stop camera after successful capture
        stopCamera();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!cameraConsent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <p className="text-gray-600">Camera access is required for identity logging.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Identity Logging</span>
        </CardTitle>
        <CardDescription>
          Capture photos for workplace check-in, visitor logging, or safety reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive && (
          <Button onClick={startCamera} className="w-full" size="lg">
            Start Camera
          </Button>
        )}

        {isActive && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleCapture} 
                disabled={uploading}
                className="flex-1"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging Entry...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture & Log
                  </>
                )}
              </Button>
              
              <Button onClick={stopCamera} variant="outline" size="lg">
                Stop
              </Button>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{cameraError}</p>
          </div>
        )}

        {locationError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">Location: {locationError}</p>
          </div>
        )}

        {lastCapture && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                Last entry logged: {lastCapture}
              </p>
            </div>
          </div>
        )}

        {location && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              Current Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

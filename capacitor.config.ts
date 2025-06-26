import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.49b6f1fbc2354f079d987e209fe31304',
  appName: 'SafeTrack - Personal Security Monitor',
  webDir: 'dist',
  server: {
    url: 'https://49b6f1fb-c235-4f07-9d98-7e209fe31304.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    Geolocation: {
      permissions: ['location']
    },
    Microphone: {
      permissions: ['microphone']
    }
  }
};

export default config;

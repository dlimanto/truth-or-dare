import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withViewTransitions } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }), 
    
    provideRouter(
      routes,
      withViewTransitions()
    ), 
    
    provideFirebaseApp(() => initializeApp({
      projectId: 'truth-or-dare-f1cea',
      appId: '1:292510976890:web:942e46d5b5e48e0710e4c3',
      databaseURL: 'https://truth-or-dare-f1cea-default-rtdb.asia-southeast1.firebasedatabase.app',
      storageBucket: 'truth-or-dare-f1cea.firebasestorage.app',
      apiKey: 'AIzaSyBNuRsCveCZ6t1x-6KEmQiY_Chgnd1ef9A',
      authDomain: 'truth-or-dare-f1cea.firebaseapp.com',
      messagingSenderId: '292510976890'
    })), 
    provideDatabase(() => getDatabase())
  ]
};

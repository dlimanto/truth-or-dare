import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'ToD - Lobby',
    loadComponent: () => import('./features/lobby/lobby.page').then(m => m.LobbyPage)
  },
  {
    path: 'board',
    title: 'ToD - Board',
    loadComponent: () => import('./features/board/board.page').then(m => m.BoardPage)
  },
  {
    path: 'cards',
    title: 'ToD - Card List',
    loadComponent: () => import('./features/card-list/card-list.page').then(m => m.CardListPage)
  }
];

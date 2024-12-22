import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FirebaseApp } from '@angular/fire/app';
import { Database, getDatabase, ref, update } from '@angular/fire/database';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionCard, ionMenu, ionRefresh } from '@ng-icons/ionicons';
import { PopoverComponent } from './core/components/popover';

@Component({
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block p-6 lg:p-16 w-screen h-screen relative'
  },
  imports: [
    RouterLink,
    RouterOutlet,
    NgIconComponent,
    PopoverComponent
  ],
  providers: [
    provideIcons({ ionCard, ionRefresh, ionMenu })
  ]
})
export class AppComponent {

  public readonly isPopoverOpen: WritableSignal<boolean> = signal(false)
  protected readonly db!: Database;

  constructor(
    protected readonly router: Router,
    protected readonly app: FirebaseApp,
  ) {
    this.db = getDatabase(this.app);
  }

  public reset(): void{
    this.isPopoverOpen.set(false);
    
    update(
      ref(this.db, 'gameStates'), 
      { 
        
        turn: 0, 
        isPlaying: false, 
        selectedCard: -1, 
        isShuffling: false,
      }
    ).then(() => {
      this.router.navigateByUrl('/');
    });
  }
}

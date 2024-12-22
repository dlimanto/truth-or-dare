import { ChangeDetectionStrategy, Component, OnDestroy, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp } from '@angular/fire/app';
import { Database, DataSnapshot, getDatabase, onValue, ref, set, Unsubscribe, update } from '@angular/fire/database';

@Component({
  selector: 'app-lobby',
  styleUrl: './lobby.page.scss',
  templateUrl: './lobby.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col size-full'
  }
})
export class LobbyPage implements OnDestroy {

  public readonly isJoined: WritableSignal<boolean> = signal(false);
  public readonly isJoining: WritableSignal<boolean> = signal(false);
  public readonly isStarting: WritableSignal<boolean> = signal(false);
  protected readonly db!: Database;
  protected stopWaiting?: Unsubscribe;

  constructor(
    protected readonly router: Router,
    protected readonly app: FirebaseApp,
  ) {
    this.db = getDatabase(this.app);
  }

  public ngOnDestroy(): void{
    this.stopWaiting?.();
  }

  public start(): void{
    this.isStarting.set(true);
    update(ref(this.db, 'gameStates'), { isPlaying: true, turn: this.getDeviceID(), selectedCard: -1 });
  }

  public join(n: string): void{
    if (!n) {
      return;
    }
    this.isJoining.set(true);
    
    const id = this.getDeviceID();
    set(
      ref(this.db, 'players/' + id),
      {
        id,
        name: n,
      }
    )
    .catch(() => {
      this.isJoining.set(false);
    })
    .then(() => {
      this.isJoined.set(true);
      this.isJoining.set(false);
      
      this.waitingToPlay();
    });
  }

  protected getDeviceID(): string{
    const screen = window.screen;
    const navigator = window.navigator;
    
    return navigator.mimeTypes.length
      + navigator.userAgent.replace(/\D+/g, '')
      + navigator.plugins.length
      + screen.height || ''
      + screen.width || ''
      + screen.pixelDepth || '';
  }

  protected waitingToPlay(): void{
    this.stopWaiting = onValue(
      ref(this.db, 'gameStates/isPlaying'),
      (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        if (snapshot.val()) {
          this.stopWaiting?.();
          this.router.navigateByUrl('/board');
        }
      }
    );
  }
}

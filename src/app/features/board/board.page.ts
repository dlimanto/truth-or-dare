import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, Signal, signal, viewChildren, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp } from '@angular/fire/app';
import { Database, DataSnapshot, getDatabase, onValue, ref, Unsubscribe, update } from '@angular/fire/database';

@Component({
  selector: 'app-board',
  styleUrl: './board.page.scss',
  templateUrl: './board.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col size-full'
  }
})
export class BoardPage implements OnDestroy {

  public readonly playerTurn: WritableSignal<string> = signal('');
  public readonly isShuffling: WritableSignal<boolean> = signal(false);
  public readonly cards: Signal<readonly ElementRef<HTMLElement>[]> = viewChildren('card');
  public readonly selectedCard: WritableSignal<{ type: string, label: string } | null> = signal(null);
  public firstCardIndex: number = 0;
  
  protected readonly db!: Database;
  protected readonly subs!: Unsubscribe[];
  protected readonly players: Map<string, string> = new Map();
  protected readonly cardsMap: Map<string, { type: string, label: string }> = new Map();
  
  protected withAlcohol: boolean = false;
  protected interval?: ReturnType<typeof setInterval>;

  constructor(
    protected readonly router: Router,
    protected readonly app: FirebaseApp,
  ) {
    this.db = getDatabase(this.app);

    this.subs = [
      // Handle Reset
      onValue(
        ref(this.db, 'gameStates/isPlaying'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          if (!snapshot.val()) {
            this.router.navigateByUrl('/');
            return; 
          }
        }
      ),

      // Handle Turn Changes
      onValue(
        ref(this.db, 'gameStates/turn'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }
          this.playerTurn.set(this.players.get(snapshot.val()) || 'Unknown');
        }
      ),

      // Handle Added Card
      onValue(
        ref(this.db, 'cards'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          Object.keys(snapshot.val()).forEach(
            (k) => {
              this.cardsMap.set(k, snapshot.val()[k]);
            }
          );
        }
      ),

      // Handle Joined Player
      onValue(
        ref(this.db, 'players'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          Object.keys(snapshot.val()).forEach(
            (k) => {
              this.players.set(k, snapshot.val()[k].name);
            }
          );
        }
      ),

      // Handle With Alcohol
      onValue(
        ref(this.db, 'gameStates/withAlcohol'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }
          this.withAlcohol = snapshot.val();
        }
      ),

      // Handle Selected Card
      onValue(
        ref(this.db, 'gameStates/selectedCard'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          setTimeout(
            () => {
              if (snapshot.val() === -2) {
                this.selectedCard.set({ type: 'DARE', label: 'Drink' });
                return;
              }
              
              this.selectedCard.set(
                snapshot.val() === -1? null : (this.cardsMap.get(snapshot.val().toString()) || null)
              );  
            }, 
            200
          );
        }
      ),

      // Handle Shuffling Animation
      onValue(
        ref(this.db, 'gameStates/isShuffling'),
        (snapshot: DataSnapshot) => {
          if (!snapshot.exists()) {
            return;
          }
          this.isShuffling.set(snapshot.val());

          if (!this.isShuffling()) {
            clearInterval(this.interval);
            return;
          }

          let index = 0;
          this.cards().forEach(
            (c, i) => {
              c.nativeElement.style.zIndex = (999 - i).toString();
              c.nativeElement.style.transform = `translateX(-${ 50 + i }%)`;
            }
          );
          
          this.interval = setInterval(
            () => {
              const i = index % 10;
              const card = this.cards()[i];
              const prevZ = card.nativeElement.style.zIndex;

              card.nativeElement.style.transform = 'translateX(10%)';
              setTimeout(
                () => {
                  card.nativeElement.style.transform = `translateX(-59%)`;
                  card.nativeElement.style.zIndex = (+(prevZ || 999) - 10).toString();
                }, 
                300
              );

              for (let j = 0; j < this.cards().length; j++) {
                if (i === j) continue;

                const x = +this.cards()[j].nativeElement.style.transform.split('(')[1].split('%')[0];
                this.cards()[j].nativeElement.style.transform = `translateX(${ x + 1 }%)`;

                if (x === -50) {
                  this.firstCardIndex = j;
                }
              }
              index++;
            }, 
            500
          );
        }
      )
    ];
  }

  public ngOnDestroy(): void{
    clearInterval(this.interval);
    this.subs.forEach((s) => s());
  }

  public pick(): void{
    if (this.isShuffling()) return;
    
    update(
      ref(this.db, 'gameStates'), 
      { 
        selectedCard: -1,
        isShuffling: true, 
        turn: this.getDeviceID() 
      }
    )
    .then(
      () => {
        setTimeout(
          () => {
            let isCard = 1;

            if (this.withAlcohol) {
              isCard = this.getRandomNumber(101);
            }

            update(
              ref(this.db, 'gameStates'), 
              {
                isShuffling: false,
                selectedCard: isCard >= 30? this.getRandomNumber(100) : -2
              }
            );
          }, 
          this.getRandomNumber(5000)
        );
      }
    );
  }

  protected getRandomNumber(max: number): number{
    return Math.floor(Math.random() * max); // Generates a number between 0 and 100
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
}

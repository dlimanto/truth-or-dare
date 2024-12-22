import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp } from '@angular/fire/app';
import { Database, getDatabase, get, child, ref } from '@angular/fire/database';

@Component({
  selector: 'app-card-list',
  styleUrl: './card-list.page.scss',
  templateUrl: './card-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col size-full gap-6 overflow-y-auto'
  }
})
export class CardListPage implements OnInit {

  public readonly cards: WritableSignal<{ type: string, label: string }[]> = signal([]);
  public readonly count: { [t: string]: number } = {
    DARE: 0,
    TRUTH: 0
  };
  public readonly color: { [t: string]: string } = {
    DARE: 'red',
    TRUTH: 'sky'
  };
  protected readonly db!: Database;

  constructor(
    protected readonly router: Router,
    protected readonly app: FirebaseApp,
  ) {
    this.db = getDatabase(this.app);
  }

  public ngOnInit(): void{
    get(
      child(
        ref(this.db), 
        'cards'
      )
    ).then((snapshot) => {
      const c: { label: string, type: string }[] = [];
      
      Object.keys(snapshot.val()).forEach((k) => {
        this.count[snapshot.val()[k].type]++;
        c.push(snapshot.val()[k]);
      });

      c.sort(() => Math.random() - 0.5);
      this.cards.set(c);
    });
  }
}

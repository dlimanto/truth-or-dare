import { ChangeDetectionStrategy, Component, contentChild, effect, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'up-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `
})
export class PopoverComponent {

  public readonly width: ModelSignal<string> = model('100%');
  public readonly height: ModelSignal<string> = model('auto');
  public readonly maxWidth: ModelSignal<string> = model('350px');
  public readonly maxHeight: ModelSignal<string> = model('100%');
  public readonly isOpen: ModelSignal<boolean> = model.required();
  public readonly parent: InputSignal<HTMLElement> = input.required();
  public readonly position: InputSignal<'top' | 'bottom' | 'right' | 'left'> = input<'top' | 'bottom' | 'right' | 'left'>('bottom');
  public readonly template: Signal<TemplateRef<any> | undefined> = contentChild('content');
  public readonly dismissed: OutputEmitterRef<any> = output();
  protected readonly positionMap: { 
    [p: string]: {
      offsetX: number;
      offsetY: number;
      position: ConnectedPosition;
    }
  } = {
    top: {
      offsetX: 0,
      offsetY: -8,
      position: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom'
      }
    },
    bottom: {
      offsetX: 0,
      offsetY: 8,
      position: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top'
      }
    },
    right: {
      offsetX: 8,
      offsetY: 0,
      position: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center'
      }
    },
    left: {
      offsetX: -8,
      offsetY: 0,
      position: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center'
      }
    }
  };
  protected _overlayRef?: OverlayRef;

  constructor(
    protected readonly overlay: Overlay,
    protected readonly viewContainerRef: ViewContainerRef
  ) {
    effect(() => {
      if (!this.isOpen()) {
        this._overlayRef?.detach();
        this._overlayRef?.dispose();
        this._overlayRef = undefined;

        return;
      }
      this.openPopover();
    });
  }

  protected openPopover(): void{
    const { offsetX, offsetY, position } = this.positionMap[this.position()];

    this._overlayRef = this.overlay.create({
      hasBackdrop: true,
      width: this.width(),
      height: this.height(),
      maxWidth: this.maxWidth(),
      maxHeight: this.maxHeight(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.parent())
        .withDefaultOffsetX(offsetX)
        .withDefaultOffsetY(offsetY)
        .withFlexibleDimensions(false)
        .withPositions([ position ])
    });

    this._overlayRef.attach(
      new TemplatePortal(
        this.template()!,
        this.viewContainerRef
      )
    );
    
    firstValueFrom(
      this._overlayRef.backdropClick()
    ).then(() => {
      this.isOpen.set(false);
      this.dismissed.emit(undefined);
    });
  }
}

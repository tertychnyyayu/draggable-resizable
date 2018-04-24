import { Point, Rect } from './size';
import { Ghost } from './ghost';
import { Parametrized, IDestructable, noop } from './util';

export class Draggable extends Parametrized<Draggable.Params> implements IDestructable {
  private readonly ghost: Ghost;
  private readonly proto: HTMLElement;
  private dragPoint: Point | null = null;

  constructor (proto: HTMLElement, params: Partial<Draggable.Params> = {}) {
    super({
      container: document.body,
      onDrop: noop,
      onDrag: noop,
      ...params,
    });
    this.proto = proto;
    this.ghost = new Ghost({
      proto: this.proto,
      container: this.params.container,
      minSize: {
        height: 1,
        width: 1,
      },
    });
    this.proto.addEventListener('mousedown', this.startDrag);
  }

  destroy (): void {
    this.dragPoint = null;
    this.proto.removeEventListener('mousedown', this.startDrag);
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragPoint) {
      return;
    }

    const left = e.clientX - this.dragPoint.x;
    const top = e.clientY - this.dragPoint.y;
    this.ghost.place({ left, top });
  }

  private onMouseUp = () => {
    if (!this.dragPoint) {
      return;
    }
    this.dragPoint = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    const rect = this.ghost.relativeRect;
    this.params.onDrop(rect);
    this.params.container.removeChild(this.ghost.el);
  }

  private startDrag = (e: MouseEvent) => {
    this.params.container.appendChild(this.ghost.el);
    const targetRect = this.proto.getBoundingClientRect();
    this.dragPoint = {
      x: e.clientX - targetRect.left,
      y: e.clientY - targetRect.top,
    };

    const { width, height } = targetRect;
    this.ghost.setSize({ width, height });
    this.ghost.place({
      left: targetRect.left,
      top: targetRect.top,
    });
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onDrag();
  }
}

export namespace Draggable {
  export interface Params {
    container: HTMLElement;
    onDrop: (point: Rect) => void;
    onDrag: () => void;
  }
}


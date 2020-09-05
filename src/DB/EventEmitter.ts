import * as assert from "assert";
import * as Base from "events";

const EMITTER = new Base();

const EVENTS: Event[] = ["create", "update", "delete", "restore"];

const ERROR_GENERATOR = (event: string) => `Unexpected event "${event}"`;

export type Event = "create" | "update" | "delete" | "restore";

class EventEmitter<T extends Record<string, unknown> = any> extends Base {
  protected _prefix: string;

  constructor(connection: string, collection: string) {
    super();

    this._prefix = `${connection}.${collection}`;
  }

  public emit(event: Event, data: T) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.emit(`${this._prefix}:${event}`, data);
  }

  public eventNames() {
    return EMITTER.eventNames().map((event: any) =>
      event.replace(`${this._prefix}:`, ""),
    );
  }

  public listenerCount(event: Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.listenerCount(`${this._prefix}:${event}`);
  }

  public listeners(event: Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.listeners(`${this._prefix}:${event}`);
  }

  public on(event: Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.on(`${this._prefix}:${event}`, listener);

    return this;
  }

  public once(event: Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.once(`${this._prefix}:${event}`, listener);

    return this;
  }

  public prependListener(event: Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.prependListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public prependOnceListener(event: Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.prependOnceListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public removeAllListeners(event?: Event) {
    assert(event && EVENTS.includes(event), ERROR_GENERATOR(event as string));

    EMITTER.removeAllListeners(event && `${this._prefix}:${event}`);

    return this;
  }

  public removeListener(event: Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.removeListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public rawListeners(event: Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.rawListeners(`${this._prefix}:${event}`);
  }
}

export default EventEmitter;

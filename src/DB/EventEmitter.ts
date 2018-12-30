import * as assert from "assert";
import * as Base from "events";

const EMITTER = new Base();

const EVENTS: EventEmitter.Event[] = ["create", "update", "delete", "restore"];

const ERROR_GENERATOR = (event: string) => `Unexpected event "${event}"`;

namespace EventEmitter {
  export type Event = "create" | "update" | "delete" | "restore";
}

class EventEmitter<T extends object = any> extends Base {
  protected _prefix: string;

  constructor(connection: string, collection: string) {
    super();

    this._prefix = `${connection}.${collection}`;
  }

  public emit(event: EventEmitter.Event, data: T) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.emit(`${this._prefix}:${event}`, data);
  }

  public eventNames() {
    return EMITTER.eventNames().map((event: any) => event.replace(`${this._prefix}:`, ""));
  }

  public listenerCount(event: EventEmitter.Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.listenerCount(`${this._prefix}:${event}`);
  }

  public listeners(event: EventEmitter.Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.listeners(`${this._prefix}:${event}`);
  }

  public on(event: EventEmitter.Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.on(`${this._prefix}:${event}`, listener);

    return this;
  }

  public once(event: EventEmitter.Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.once(`${this._prefix}:${event}`, listener);

    return this;
  }

  public prependListener(event: EventEmitter.Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.prependListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public prependOnceListener(event: EventEmitter.Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.prependOnceListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public removeAllListeners(event?: EventEmitter.Event) {
    assert(event && EVENTS.includes(event), ERROR_GENERATOR(event as string));

    EMITTER.removeAllListeners(event && `${this._prefix}:${event}`);

    return this;
  }

  public removeListener(event: EventEmitter.Event, listener: (data: T) => void) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    EMITTER.removeListener(`${this._prefix}:${event}`, listener);

    return this;
  }

  public rawListeners(event: EventEmitter.Event) {
    assert(EVENTS.includes(event), ERROR_GENERATOR(event));

    return EMITTER.rawListeners(`${this._prefix}:${event}`);
  }
}

export default EventEmitter;

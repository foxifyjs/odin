import * as EventEmitter from "events";
// import { ChangeStream } from "mongodb";
// import { connection as getConnection } from "./Connect";

// const WATCHERS: { [watcher: string]: ChangeStream } = {};

class Event extends EventEmitter {
  // public on(event: string, listener: (data: any) => void) {
  //   if (this.listenerCount(event) === 0) {
  //     const [CONNECTION, COLLECTION] = event.replace(/(:.+)/, "").split(".");

  //     getConnection(CONNECTION).collection(COLLECTION).watch().on("change", console.log);

  //     console.log(CONNECTION, COLLECTION);
  //   }

  //   return super.on(event, listener);
  // }
}

export default Event;

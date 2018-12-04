import * as Odin from "../../src";
import { array } from "../../src/utils";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

const Types = Odin.Types;

const USERS = [
  {
    username: "ardalanamini",
    email: "ardalanamini22@gmail.com",
    name: {
      first: "Ardalan",
      last: "Amini",
    },
  },
  {
    username: "john",
    email: "johndue@example.com",
    name: {
      first: "John",
      last: "Due",
    },
  },
];

const CHATS = [
  {
    name: "chat 1",
    chatable_id: "ardalanamini",
    chatable_type: "User",
  },
  {
    name: "chat 2",
    chatable_id: "ardalanamini",
    chatable_type: "User",
  },
  {
    name: "chat 3",
    chatable_id: "john",
    chatable_type: "User",
  },
  {
    name: "2",
    chatable_id: "123",
    chatable_type: "Something",
  },
];

const MESSAGES = [
  {
    chat: "chat 1",
    message: "1: Hello World",
  },
  {
    chat: "chat 1",
    message: "2: Hello World",
  },
  {
    chat: "chat 2",
    message: "3: Hello World",
  },
  {
    chat: "chat 2",
    message: "4: Hello World",
  },
  {
    chat: "chat 2",
    message: "5: Hello World",
  },
  {
    chat: "chat 4",
    message: "6: Hello World",
  },
];

Odin.Connect({
  default: {
    database: global.__MONGO_DB_NAME__,
    connection: global.__MONGO_CONNECTION__,
  },
});

@Odin.register
class User extends Odin {
  public static schema = {
    username: Types.string.alphanum.min(3).required,
    email: Types.string.email.required,
    name: {
      first: Types.string.min(3).required,
      last: Types.string.min(3),
    },
  };

  @Odin.relation
  public chats() {
    return this.morphMany<Chat>("Chat", "username");
  }
}

// tslint:disable-next-line:max-classes-per-file
@Odin.register
class Chat extends Odin {
  public static schema = {
    chatable_id: Types.string.alphanum.min(3).required,
    chatable_type: Types.string.required,
    name: Types.string.required,
  };

  @Odin.relation
  public user() {
    return this.hasOne<User>("User", "user", "chatable_id");
  }

  @Odin.relation
  public messages() {
    return this.hasMany<Message>("Message", "name", "chat");
  }
}

// tslint:disable-next-line:max-classes-per-file
@Odin.register
class Message extends Odin {
  public static schema = {
    chat: Types.string.required,
    message: Types.string.required,
  };

  @Odin.relation
  public chat() {
    return this.hasOne<Chat>("Chat", "chat", "name");
  }
}

const refresh = async (done: jest.DoneCallback) => {
  await User.delete();
  await User.insert(USERS);
  const users: any[] = await User.lean().get();
  USERS.length = 0;
  USERS.push(...users);

  await Chat.delete();
  await Chat.insert(CHATS);
  const chats: any[] = await Chat.lean().get();
  CHATS.length = 0;
  CHATS.push(...chats);

  await Message.delete();
  await Message.insert(MESSAGES);
  const messages: any[] = await Message.lean().get();
  MESSAGES.length = 0;
  MESSAGES.push(...messages);

  done();
};

beforeAll(refresh);

afterEach(refresh);

afterAll(async (done) => {
  await User.delete();
  await Chat.delete();
  await Message.delete();

  done();
});

test("Model.with", async () => {
  expect.assertions(2);

  const items = USERS.map(user => ({
    ...user,
    chats: CHATS.filter(chat => chat.chatable_id === user.username && chat.chatable_type === "User"),
  }));

  const results = await User.with("chats").lean().get();

  expect(results).toEqual(items);

  const results2 = await User.with("chats").get();

  expect(results2.map((item: any) => item.toJSON())).toEqual(items);
});

test("Model.with deep", async () => {
  expect.assertions(4);

  const items = USERS.map((user) => {
    const chats = CHATS.filter(chat => chat.chatable_id === user.username && chat.chatable_type === "User")
      .map(chat => ({
        ...chat,
        messages: MESSAGES.filter(message => message.chat === chat.name),
      }));

    return {
      ...user,
      chats,
    };
  });

  const results = await User.with("chats", "chats.messages").lean().get();

  expect(results).toEqual(items);

  const results2 = await User.with("chats.messages").lean().get();

  expect(results2).toEqual(items);

  const results3 = await User.with("chats", "chats.messages").get();

  expect(results3.map((item: any) => item.toJSON())).toEqual(items);

  const results4 = await User.with("chats.messages").get();

  expect(results4.map((item: any) => item.toJSON())).toEqual(items);
});

test("Model.has", async () => {
  expect.assertions(1);

  const items = CHATS.filter(chat => array.any(MESSAGES, message => message.chat === chat.name));

  const results = await Chat.has("messages").lean().get();

  expect(results).toEqual(items);
});

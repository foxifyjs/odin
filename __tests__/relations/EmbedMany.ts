import * as Odin from "../../src";
import { array, object } from "../../src/utils";

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
    chat_names: ["chat 1", "chat 2"],
  },
  {
    username: "john",
    email: "johndue@example.com",
    name: {
      first: "John",
      last: "Due",
    },
    chat_names: ["chat 3"],
  },
];

const CHATS = [
  {
    name: "chat 1",
    message_chats: ["1"],
  },
  {
    name: "chat 2",
    message_chats: ["2"],
  },
  {
    name: "chat 3",
    message_chats: [],
  },
];

const MESSAGES = [
  {
    chat_name: "1",
    message: "1: Hello World",
  },
  {
    chat_name: "1",
    message: "2: Hello World",
  },
  {
    chat_name: "2",
    message: "3: Hello World",
  },
  {
    chat_name: "2",
    message: "4: Hello World",
  },
  {
    chat_name: "2",
    message: "5: Hello World",
  },
];

Odin.Connect({
  database: global.__MONGO_DB_NAME__,
  connection: global.__MONGO_CONNECTION__,
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
    chat_names: Types.array.of(Types.string).default([]),
  };

  @Odin.relation
  public chats() {
    return this.embedMany<Chat>("Chat", "chat_names", "name");
  }
}

@Odin.register
class Chat extends Odin {
  public static schema = {
    name: Types.string.required,
    message_chats: Types.array.of(Types.string).default([]),
  };

  @Odin.relation
  public user() {
    return this.hasOne<User>("User", "name", "chat_names");
  }

  @Odin.relation
  public messages() {
    return this.embedMany<Message>("Message", "message_chats", "chat_name");
  }
}

@Odin.register
class Message extends Odin {
  public static schema = {
    chat_name: Types.string.numeral.required,
    message: Types.string.required,
  };

  @Odin.relation
  public chat() {
    return this.hasOne<Chat>("Chat", "chat_name", "message_chats");
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

  const items = USERS.map((user) => ({
    ...user,
    chats: CHATS.filter((chat) => user.chat_names.includes(chat.name)),
  }));

  const results = await User.with("chats").lean().get();

  expect(results).toEqual(items);

  const results2 = await User.with("chats").get();

  expect(results2.map((item: any) => item.toJSON())).toEqual(items);
});

test("Model.with (deep)", async () => {
  expect.assertions(4);

  const items = USERS.map((user) => {
    const chats = CHATS.filter((chat) =>
      user.chat_names.includes(chat.name),
    ).map((chat) => ({
      ...chat,
      messages: MESSAGES.filter((message) =>
        chat.message_chats.includes(message.chat_name),
      ),
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

  const items = CHATS.filter((chat) =>
    array.any(MESSAGES, (message) =>
      chat.message_chats.includes(message.chat_name),
    ),
  );

  const results = await Chat.has("messages").lean().get();

  expect(results).toEqual(items);
});

test("Model.has [deep]", async () => {
  expect.assertions(1);

  const items = USERS.filter((user) =>
    array.any(
      MESSAGES,
      (message) =>
        CHATS.filter((chat) =>
          user.chat_names.includes(chat.name),
        ).findIndex((chat) =>
          chat.message_chats.includes(message.chat_name),
        ) !== -1,
    ),
  );

  const results = await User.has("chats.messages").lean().get();

  expect(results).toEqual(items);
});

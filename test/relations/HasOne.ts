import * as Odin from "../../src";

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_DB_NAME__: string;
      __MONGO_CONNECTION__: any;
    }
  }
}

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
    name: "test",
    user: "ardalanamini",
  },
];

const MESSAGES = [
  {
    chat: "test",
    message: "Hello World",
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
    username: User.Types.string.alphanum.min(3).required,
    email: User.Types.string.email.required,
    name: {
      first: User.Types.string.min(3).required,
      last: User.Types.string.min(3),
    },
  };

  @Odin.relation
  public chat() {
    return this.hasOne<Chat>("Chat", "username", "user");
  }
}

// tslint:disable-next-line:max-classes-per-file
@Odin.register
class Chat extends Odin {
  public static schema = {
    user: User.Types.string.alphanum.min(3).required,
    name: User.Types.string.required,
  };

  @Odin.relation
  public user() {
    return this.hasOne<User>("User", "user", "username");
  }

  @Odin.relation
  public message() {
    return this.hasOne<Message>("Message", "name", "chat");
  }
}

// tslint:disable-next-line:max-classes-per-file
@Odin.register
class Message extends Odin {
  public static schema = {
    chat: User.Types.string.required,
    message: User.Types.string.required,
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
  expect.assertions(1);

  const items = USERS.map(user => ({
    ...user,
    chat: CHATS.filter(chat => chat.user === user.username)[0],
  }));

  const results = await User.with("chat").lean().get();

  expect(results).toEqual(items);
});

test("Model.with deep", async () => {
  expect.assertions(2);

  const items = USERS.map((user) => {
    const chat = CHATS.filter(chat => chat.user === user.username)[0];

    if (chat) (chat as any).message = MESSAGES.filter(message => message.chat === chat.name)[0];

    return {
      ...user,
      chat,
    };
  });

  const results = await User.with("chat", "chat.message").lean().get();

  expect(results).toEqual(items);

  const results2 = await User.with("chat.message").lean().get();

  expect(results2).toEqual(items);
});

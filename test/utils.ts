import * as utils from "../src/utils";

describe("Testing `utils`", () => {
  test("getGetterName", () => {
    expect(utils.getGetterName("first_name")).toBe("getFirstNameAttribute");
  });

  test("getSetterName", () => {
    expect(utils.getSetterName("first_name")).toBe("setFirstNameAttribute");
  });

  test("makeCollectionName", () => {
    expect(utils.makeCollectionName("user_account")).toBe("user_accounts");
  });

  test("makeCollectionType", () => {
    expect(utils.makeCollectionType("user_accounts")).toBe("user_account");
  });

  test("makeCollectionId", () => {
    expect(utils.makeCollectionId("user_accounts")).toBe("user_account_id");
  });

  test("makeMorphType", () => {
    expect(utils.makeMorphType("user_accounts")).toBe("user_accountable");
  });
});

import * as utils from "../src/utils";

describe("Testing `utils`", () => {
  test("getGetterName", () => {
    expect(utils.getGetterName("first_name")).toBe("getFirstNameAttribute");
  });

  test("getSetterName", () => {
    expect(utils.getSetterName("first_name")).toBe("setFirstNameAttribute");
  });

  test("makeTableName", () => {
    expect(utils.makeTableName("user_account")).toBe("user_accounts");
  });

  test("makeTableType", () => {
    expect(utils.makeTableType("user_accounts")).toBe("user_account");
  });

  test("makeTableId", () => {
    expect(utils.makeTableId("user_accounts")).toBe("user_account_id");
  });

  test("makeMorphType", () => {
    expect(utils.makeMorphType("user_accounts")).toBe("user_accountable");
  });
});

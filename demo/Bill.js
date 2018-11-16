const Model = require("../dist");

class Bill extends Model {
    user() {
        return this.hasOne("User");
    }
}

Bill.schema = {
    user_id: Bill.Types.Id.required,
    bill: Bill.Types.Number.positive.required,
};

Model.register(Bill);

module.exports = Bill;

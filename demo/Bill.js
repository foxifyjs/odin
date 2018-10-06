const Model = require("../dist/index");

const {
    Types
} = Model;

class Bill extends Model {
    user() {
        return this.hasOne(Model.models.User);
    }
}

Bill.schema = {
    user_id: Types.ObjectId.required,
    bill: Types.Number.positive.required,
};

Model.register(Bill);

module.exports = Bill;

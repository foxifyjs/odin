const Model = require("../dist/index");

const {
    Types
} = Model;

class Bill extends Model {}

Bill.prototype.user = function () {
    return Bill.prototype.hasOne(require("./User"));
}

module.exports = Bill;

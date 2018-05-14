const Model = require("../dist/index");

const {
    Types
} = Model;

class User extends Model {}

User.schema = {
    name: {
        first: Types.String.min(3).required,
        last: Types.String.min(3),
    },
    username: Types.String.token.required,
    email: Types.String.email.required,
};

User.prototype.bills = function () {
    return User.prototype.hasMany(require("./Bill"));
}

module.exports = User;

const Model = require("../dist/index");

const {
    Types
} = Model;

class User extends Model {
    bills() {
        return this.hasMany(require("./Bill"));
    }
}

User.schema = {
    name: {
        first: Types.String.min(3).required,
        last: Types.String.min(3),
    },
    username: Types.String.token.required,
    email: Types.String.email.required,
};

module.exports = User;

const Model = require("../dist");

class User extends Model {
    bills() {
        return this.hasMany("Bill");
    }
}

User.schema = {
    name: {
        first: User.Types.String.min(3).required,
        last: User.Types.String.min(3),
    },
    username: User.Types.String.token.required,
    email: User.Types.String.email.required,
};

Model.register(User);

module.exports = User;

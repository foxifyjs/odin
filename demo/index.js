const path = require("path")
const env = require("dotenv").load({
    path: path.resolve(__dirname, ".env")
}).parsed;

const Model = require("../dist/index");
const User = require("./User");
const Bill = require("./Bill");

Model.connections({
    default: {
        driver: env.DRIVER,
        database: env.DATABASE,
        user: env.USER,
        password: env.PASSWORD
    }
})

const test = async () => {
    console.log("Starting...");

    const start = new Date().getTime();

    // const result = await Bill.with("user").first();
    /* or: */
    let result = await Bill.first();
    result = await result.user().first();

    const end = new Date().getTime();

    console.log(
        "\n--------------------------------------------------\n",
        result,
        "\n--------------------------------------------------\n"
    );

    console.log(`Finished in ${end - start}ms`);

    process.exit(0);
};

test();
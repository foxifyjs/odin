const env = require("dotenv").load({
    path: require("path").resolve(__dirname, ".env")
}).parsed;

const Model = require("../dist/index");

const time = () => new Date().getTime();

console.log(`Connecting...`);

const start = time();

Model.Connect({
    default: {
        database: env.DATABASE,
        auth: {
            user: env.USER,
            password: env.PASSWORD
        },
    }
})

const Bill = require("./Bill");
const User = require("./User");

const end = time();

console.log(
    `Connected in ${end - start}ms\n`,
    "\n**************************************************\n",
);

const test = async () => {
    const tester = async () => {
        return await User.with("bills").first();
    }

    console.log("Starting first...\n");

    let start = time();

    await tester();

    console.log(`Finished first in ${time() - start}ms\n`);

    console.log("Starting second...");

    start = time();

    const result = await tester();

    const end = time();

    console.log(
        "\n--------------------------------------------------\n",
        result,
        "\n--------------------------------------------------\n"
    );

    console.log(`Finished second in ${end - start}ms`);

    process.exit(0);
};

test();
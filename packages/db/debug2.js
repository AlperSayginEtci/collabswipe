const { execSync } = require("child_process");
const fs = require("fs");

try {
  const result = execSync("npx prisma validate", { encoding: "utf-8", env: {...process.env, NO_COLOR: '1'} });
  fs.writeFileSync("clean_output.txt", result);
  console.log("Validation Successful");
} catch (error) {
  fs.writeFileSync("clean_output.txt", "STDOUT:\n" + error.stdout + "\nSTDERR:\n" + error.stderr);
  console.log("Validation Failed");
}

const { execSync } = require("child_process");

try {
  const result = execSync("npx prisma validate", { encoding: "utf-8", stdio: "pipe" });
  console.log("SUCCESS:", result);
} catch (error) {
  console.log("ERROR OUTPUT:");
  console.log(error.stdout);
  console.log("ERROR STDERR:");
  console.log(error.stderr);
}

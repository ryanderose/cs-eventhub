import { execSync } from "node:child_process";

console.log("Bootstrapping workspace...");
execSync("pnpm install", { stdio: "inherit" });

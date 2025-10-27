const budgets = {
  sdkUmd: 45 * 1024,
  sdkEsm: 35 * 1024,
  block: 15 * 1024,
  tokens: 12 * 1024
};

console.log("Bundle budgets:");
for (const [key, limit] of Object.entries(budgets)) {
  console.log(` - ${key}: ${limit} bytes`);
}
console.log("Current bundles are stubs; future builds must measure actual sizes.");

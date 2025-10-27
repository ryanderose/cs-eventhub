import { writeFileSync } from "node:fs";

const sbom = {
  spdxVersion: "SPDX-2.3",
  dataLicense: "CC0-1.0",
  name: "Events Hub",
  creationInfo: {
    creators: ["Tool: sbom.mjs"],
    created: new Date().toISOString()
  },
  packages: []
};

writeFileSync(".sbom/spdx.json", JSON.stringify(sbom, null, 2));
console.log("SBOM written to .sbom/spdx.json");

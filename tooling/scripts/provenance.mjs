import { writeFileSync } from "node:fs";

const provenance = {
  version: 1,
  buildType: "https://slsa.dev/provenance/v1",
  invocation: {
    parameters: {
      command: "turbo run build"
    }
  },
  metadata: {
    buildStartedOn: new Date().toISOString()
  }
};

writeFileSync(".sbom/provenance.json", JSON.stringify(provenance, null, 2));
console.log("Provenance written to .sbom/provenance.json");

export interface InterpretInput {
  text: string;
  tenantId: string;
}

export interface InterpretResult {
  query: {
    intent: "search" | "qa" | "navigate";
    filters: Record<string, unknown>;
    version: "dsl/1";
  };
}

export function interpret(input: InterpretInput): InterpretResult {
  const text = input.text.toLowerCase();
  const filters: Record<string, unknown> = {};
  if (text.includes("today")) {
    filters.dateRange = { preset: "today" };
  }
  if (text.includes("concert")) {
    filters.categories = ["concerts"];
  }
  return {
    query: {
      intent: "search",
      filters,
      version: "dsl/1"
    }
  };
}

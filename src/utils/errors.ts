export class RepoFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepoFlowError";
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof RepoFlowError) {
    return `Error: ${error.message}`;
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return "Error: Unexpected error.";
}

import prompts from "prompts";

export { prompts };

export async function confirm(message: string): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message,
    initial: false,
  });

  return response.value ?? false;
}

export async function select<T extends string>(
  message: string,
  choices: Array<{ title: string; value: T }>,
  initial = 0,
): Promise<T | undefined> {
  const response = await prompts({
    type: "select",
    name: "value",
    message,
    choices,
    initial,
  });

  return response.value as T | undefined;
}

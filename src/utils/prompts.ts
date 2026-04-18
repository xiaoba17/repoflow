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

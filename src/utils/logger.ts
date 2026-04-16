export function writeStdout(content: string): void {
  process.stdout.write(content);
}

export function writeLine(content: string): void {
  process.stdout.write(`${content}\n`);
}

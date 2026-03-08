import fs from "fs-extra";
import path from "path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function makeExecutable(filePath: string): Promise<void> {
  await fs.chmod(filePath, 0o755);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function directoryHasContent(dir: string): Promise<boolean> {
  if (!(await fs.pathExists(dir))) return false;
  const entries = await fs.readdir(dir);
  return entries.some((e) => e !== ".git");
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function readJson<T>(filePath: string): Promise<T> {
  return fs.readJson(filePath) as Promise<T>;
}

export async function writeJson(
  filePath: string,
  data: unknown
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

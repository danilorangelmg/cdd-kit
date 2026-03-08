export interface GitmoduleEntry {
  name: string;
  path: string;
  url: string;
}

export interface ParsedGitUrl {
  provider: "github" | "gitlab" | "bitbucket";
  org: string;
  repo: string;
}

/**
 * Parse .gitmodules file content into structured entries.
 */
export function parseGitmodules(content: string): GitmoduleEntry[] {
  const entries: GitmoduleEntry[] = [];
  const lines = content.split("\n");

  let current: Partial<GitmoduleEntry> | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^\[submodule\s+"(.+)"\]/);
    if (sectionMatch) {
      if (current?.name && current.path && current.url) {
        entries.push(current as GitmoduleEntry);
      }
      current = { name: sectionMatch[1] };
      continue;
    }

    if (!current) continue;

    const kvMatch = line.match(/^\s*(path|url)\s*=\s*(.+)\s*$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (key === "path") current.path = value.trim();
      if (key === "url") current.url = value.trim();
    }
  }

  if (current?.name && current.path && current.url) {
    entries.push(current as GitmoduleEntry);
  }

  return entries;
}

/**
 * Parse a git URL (SSH or HTTPS) into provider, org, and repo.
 */
export function parseGitUrl(url: string): ParsedGitUrl | null {
  // SSH: git@github.com:org/repo.git
  const sshMatch = url.match(
    /^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/
  );
  if (sshMatch) {
    const [, domain, org, repo] = sshMatch;
    const provider = domainToProvider(domain);
    if (provider) return { provider, org, repo };
  }

  // HTTPS: https://github.com/org/repo.git
  const httpsMatch = url.match(
    /^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/
  );
  if (httpsMatch) {
    const [, domain, org, repo] = httpsMatch;
    const provider = domainToProvider(domain);
    if (provider) return { provider, org, repo };
  }

  return null;
}

function domainToProvider(
  domain: string
): "github" | "gitlab" | "bitbucket" | null {
  if (domain.includes("github")) return "github";
  if (domain.includes("gitlab")) return "gitlab";
  if (domain.includes("bitbucket")) return "bitbucket";
  return null;
}

/**
 * Detect common prefix from a list of repository/directory names.
 * E.g. ["proj-frontend", "proj-backend"] → "proj-"
 */
export function detectCommonPrefix(names: string[]): string {
  if (names.length < 2) return "";

  const sorted = [...names].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  let i = 0;
  while (i < first.length && first[i] === last[i]) {
    i++;
  }

  const prefix = first.substring(0, i);

  // Only return if prefix ends with a separator (-, _, .)
  const separatorMatch = prefix.match(/^(.+[-_.])/);
  return separatorMatch ? separatorMatch[1] : "";
}

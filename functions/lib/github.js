// Thin wrappers around GitHub Contents + Git Data APIs.
// All fns take an env-like object: { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH }.

const API = "https://api.github.com";

function headers(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "aida-deck-edit/1.0",
    "Content-Type": "application/json",
  };
}

async function gh(env, method, path, body) {
  const res = await fetch(`${API}/repos/${env.GITHUB_REPO}${path}`, {
    method,
    headers: headers(env),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getFile(env, path) {
  const data = await gh(
    env,
    "GET",
    `/contents/${encodePath(path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`
  );
  const bin = atob(data.content.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const content = new TextDecoder("utf-8").decode(bytes);
  return { sha: data.sha, content, encoding: data.encoding };
}

// Raw bytes (for binary files like .image-slots.state.json which is text but
// callers may want raw); returns Uint8Array.
export async function getFileBytes(env, path) {
  const data = await gh(
    env,
    "GET",
    `/contents/${encodePath(path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`
  );
  const bin = atob(data.content.replace(/\n/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return { sha: data.sha, bytes: out };
}

export async function getRefSha(env) {
  const data = await gh(
    env,
    "GET",
    `/git/refs/heads/${encodeURIComponent(env.GITHUB_BRANCH)}`
  );
  return data.object.sha;
}

export async function getCommit(env, sha) {
  return gh(env, "GET", `/git/commits/${sha}`);
}

export async function createBlobFromBase64(env, base64Content) {
  const data = await gh(env, "POST", `/git/blobs`, {
    content: base64Content,
    encoding: "base64",
  });
  return data.sha;
}

export async function createBlobFromString(env, text) {
  const data = await gh(env, "POST", `/git/blobs`, {
    content: text,
    encoding: "utf-8",
  });
  return data.sha;
}

export async function createTree(env, baseTreeSha, entries) {
  const data = await gh(env, "POST", `/git/trees`, {
    base_tree: baseTreeSha,
    tree: entries.map((e) => ({
      path: e.path,
      mode: e.mode || "100644",
      type: "blob",
      sha: e.sha,
    })),
  });
  return data.sha;
}

export async function createCommit(env, parentSha, treeSha, message) {
  const data = await gh(env, "POST", `/git/commits`, {
    parents: [parentSha],
    tree: treeSha,
    message,
  });
  return data.sha;
}

export async function updateRef(env, commitSha) {
  return gh(
    env,
    "PATCH",
    `/git/refs/heads/${encodeURIComponent(env.GITHUB_BRANCH)}`,
    { sha: commitSha, force: false }
  );
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

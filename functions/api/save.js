import {
  getFile,
  getRefSha,
  getCommit,
  createBlobFromBase64,
  createBlobFromString,
  createTree,
  createCommit,
  updateRef,
} from "../lib/github.js";
import { loadDeck, applyOperations } from "../lib/slide-parse.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const operations = Array.isArray(body.operations) ? body.operations : [];
  const pendingUploads = Array.isArray(body.pending_uploads) ? body.pending_uploads : [];
  const explanation = body.explanation || "(no explanation)";

  if (operations.length === 0 && pendingUploads.length === 0) {
    return json({ error: "nothing_to_save" }, 400);
  }

  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO || !env.GITHUB_BRANCH) {
    return json({ error: "github_not_configured" }, 500);
  }

  try {
    const [htmlFile, stateFile] = await Promise.all([
      getFile(env, "index.html"),
      getFile(env, ".image-slots.state.json").catch(() => null),
    ]);

    const deck = loadDeck(htmlFile.content);
    const { orphanSlotIds } = applyOperations(deck, operations);
    const newHtml = deck.serialize();

    let newStateContent = null;
    if (stateFile && orphanSlotIds.length > 0) {
      let state;
      try {
        state = JSON.parse(stateFile.content);
      } catch {
        state = {};
      }
      let changed = false;
      for (const id of orphanSlotIds) {
        if (id in state) {
          delete state[id];
          changed = true;
        }
      }
      if (changed) newStateContent = JSON.stringify(state, null, 0);
    }

    const treeEntries = [];

    if (newHtml !== htmlFile.content) {
      const sha = await createBlobFromString(env, newHtml);
      treeEntries.push({ path: "index.html", sha });
    }
    if (newStateContent !== null) {
      const sha = await createBlobFromString(env, newStateContent);
      treeEntries.push({ path: ".image-slots.state.json", sha });
    }
    for (const up of pendingUploads) {
      if (!up.path || !up.base64) continue;
      const sha = await createBlobFromBase64(env, up.base64);
      treeEntries.push({ path: up.path, sha });
    }

    if (treeEntries.length === 0) return json({ error: "no_changes_to_commit" }, 400);

    const headSha = await getRefSha(env);
    const headCommit = await getCommit(env, headSha);
    const treeSha = await createTree(env, headCommit.tree.sha, treeEntries);

    const commitMessage = buildCommitMessage(explanation, operations, pendingUploads);
    const newCommitSha = await createCommit(env, headSha, treeSha, commitMessage);
    await updateRef(env, newCommitSha);

    return json({
      ok: true,
      commit_sha: newCommitSha,
      ops_applied: operations.length,
      files_changed: treeEntries.map((e) => e.path),
      deploy_lag_estimate_s: 60,
    });
  } catch (e) {
    const status = e.status === 409 ? 409 : 500;
    return json({ error: String(e.message || e), status }, status);
  }
}

function buildCommitMessage(explanation, ops, uploads) {
  const summary = ops.map((o) => {
    if (o.op === "replace") return `~ ${o.target_label}`;
    if (o.op === "insert_after") return `+ after ${o.ref_label}`;
    if (o.op === "insert_before") return `+ before ${o.ref_label}`;
    if (o.op === "delete") return `- ${o.target_label}`;
    return o.op;
  });
  const uploadList = uploads.map((u) => `  uploads/${u.hash}.${extFromMime(u.mime)}`);
  return [
    `edit via /edit: ${explanation}`,
    "",
    "ops:",
    ...summary.map((s) => "  " + s),
    uploadList.length ? "uploads:" : "",
    ...uploadList,
  ]
    .filter(Boolean)
    .join("\n");
}

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

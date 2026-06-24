"use strict";

/*
 * Interactive logic to add a note entry. Invoked via `vla add`.
 *
 * Questions come from config/fields.json. Answers are appended to
 * data/entries.json. A field of type "date" defaults to today.
 */

const path = require("path");
const readline = require("readline");
const { execFileSync } = require("child_process");
const {
  ROOT,
  FIELDS_PATH,
  ENTRIES_PATH,
  today,
  readJSON,
  writeJSON,
} = require("./lib/util.js");

/* Buffered line reader that works for both an interactive TTY and piped
 * stdin (where all lines can arrive before the next prompt is shown). */
function createPrompter(rl) {
  const queue = [];
  const waiters = [];
  let ended = false;

  rl.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter) waiter(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    ended = true;
    while (waiters.length) waiters.shift()(null);
  });

  return function ask(question) {
    process.stdout.write(question);
    return new Promise((resolve) => {
      if (queue.length) return resolve(queue.shift());
      if (ended) return resolve(null);
      waiters.push(resolve);
    });
  };
}

function isGitRepo() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function git(cmdArgs) {
  return execFileSync("git", cmdArgs, { cwd: ROOT, stdio: "inherit" });
}

async function addEntry({ commit = true, push = false } = {}) {
  const config = readJSON(FIELDS_PATH);
  const fields = Array.isArray(config.fields) ? config.fields : [];
  if (fields.length === 0) {
    console.error("No fields defined in config/fields.json.");
    process.exit(1);
  }

  const entries = readJSON(ENTRIES_PATH, []);
  if (!Array.isArray(entries)) {
    console.error("data/entries.json must contain a JSON array.");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  const ask = createPrompter(rl);

  console.log("\nNew entry — press Enter to skip a field.\n");

  const entry = {};
  for (const field of fields) {
    if (field.type === "date") {
      entry[field.key] = today(); // auto-added, not prompted
      continue;
    }
    const raw = await ask(`${field.label}: `);
    const value = (raw || "").trim();
    if (value) entry[field.key] = value;
  }

  rl.close();

  if (Object.keys(entry).length === 0) {
    console.log("\nNothing entered. Aborting.");
    return;
  }

  entries.push(entry);
  writeJSON(ENTRIES_PATH, entries);
  console.log(`\nSaved to ${path.relative(ROOT, ENTRIES_PATH)}.`);

  if (!commit) return;

  if (!isGitRepo()) {
    console.log("Not a git repo yet — skipping commit. (run `git init` first)");
    return;
  }

  const label = entry.date || "new entry";
  try {
    git(["add", path.relative(ROOT, ENTRIES_PATH)]);
    git(["commit", "-m", `Add entry for ${label}`]);
    if (push) {
      git(["push"]);
      console.log("\nPushed. GitHub Pages will redeploy shortly.");
    } else {
      console.log("\nCommitted. Run `git push` to deploy.");
    }
  } catch (err) {
    console.error(`\nGit step failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { addEntry };

if (require.main === module) {
  addEntry().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

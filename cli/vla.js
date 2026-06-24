#!/usr/bin/env node
"use strict";

/*
 * `vla` — unified CLI for Voilà.
 *
 *   vla add                 add a new entry (prompts each field), then commit
 *   vla serve [--port n]    preview the site locally
 *   vla export [--all]      export the Instagram cards
 *   vla fields <…>          manage the question fields
 */

const { Command } = require("commander");
const { addEntry } = require("./add-entry.js");
const { serve } = require("./serve.js");
const { exportCards } = require("./export-cards.js");
const fields = require("./fields.js");
const { today } = require("./lib/util.js");

/* Run a synchronous action, reporting errors cleanly instead of a stack trace. */
function run(fn) {
  try {
    fn();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

const program = new Command();

program
  .name("vla")
  .description("Voilà — daily routine notes; manage entries and Instagram cards.")
  .version("1.0.0");

program
  .command("add")
  .description("Add a new entry (prompts for each field) and commit it")
  .option("--no-commit", "write JSON only, skip git")
  .option("--push", "also git push after committing")
  .action((opts) => addEntry({ commit: opts.commit, push: opts.push }));

program
  .command("serve")
  .description("Preview the site on a local static server")
  .option("-p, --port <number>", "port to listen on (default 3611)")
  .action((opts) => serve({ port: opts.port }));

program
  .command("export")
  .description("Export the Instagram cards as SVG/PNG files")
  .option("--all", "export every entry (default: today only)")
  .option("--date <date>", "export a specific YYYY-MM-DD", today())
  .option("--out <dir>", "output directory", "export")
  .option("--no-png", "skip PNG rasterization")
  .option("--reel", "also stitch each entry's cards into a 1080x1920 MP4 reel")
  .option("--reel-seconds <n>", "seconds each card shows in the reel", parseFloat, 2.5)
  .action((opts) => {
    const date = opts.all ? null : opts.date;
    exportCards({
      date,
      out: opts.out,
      png: opts.png,
      reel: opts.reel,
      reelSeconds: opts.reelSeconds,
    });
  });

const fieldsCmd = program
  .command("fields")
  .description("Manage the question fields in config/fields.json");

fieldsCmd
  .command("list")
  .description("List all fields")
  .action(() => run(() => fields.listFields()));

fieldsCmd
  .command("add <key> [label]")
  .description("Add a new field")
  .option("--type <type>", "field type, e.g. 'date'")
  .option("--before <key>", "insert before this field")
  .option("--after <key>", "insert after this field")
  .action((key, label, opts) =>
    run(() => fields.addField({ key, label, type: opts.type, before: opts.before, after: opts.after }))
  );

fieldsCmd
  .command("remove <key>")
  .alias("rm")
  .description("Remove a field")
  .option("--purge", "also delete this field's answers from all entries")
  .action((key, opts) => run(() => fields.removeField(key, { purge: opts.purge })));

fieldsCmd
  .command("edit <key>")
  .description("Edit a field's label, type, or key")
  .option("--label <label>", "new display label")
  .option("--type <type>", "set the type")
  .option("--clear-type", "remove the type")
  .option("--key <newKey>", "rename the key (migrates entry data)")
  .action((key, opts) =>
    run(() =>
      fields.editField(key, {
        newKey: opts.key,
        label: opts.label,
        type: opts.type,
        clearType: opts.clearType,
      })
    )
  );

program.parseAsync().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

/* Entry point: load the field config and entries, then render the board. */

import { fetchJSON } from "./data.js";
import { render, setStatus, dateFieldKey } from "./board.js";

async function load() {
  try {
    const [config, entries] = await Promise.all([
      fetchJSON("config/fields.json"),
      fetchJSON("data/entries.json"),
    ]);
    const fields = Array.isArray(config.fields) ? config.fields : [];
    render(fields, Array.isArray(entries) ? entries : [], dateFieldKey(fields));
  } catch (err) {
    setStatus(
      "Could not load data. If opening the file directly, run a local " +
        "server instead (see README). (" + err.message + ")",
      true
    );
  }
}

load();

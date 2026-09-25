import assert from "node:assert/strict";
import test from "node:test";

import { getProjectChecklist } from "../lib/checklist";

test("parses only the seven implementation sections", () => {
  const checklist = getProjectChecklist();
  const items = checklist.sections.flatMap((section) => section.items);

  assert.equal(checklist.sections.length, 7);
  assert.equal(items.length, 53);
  assert.equal(checklist.sections.some((section) => section.title === "Status legend"), false);
  assert.equal(items.some((item) => item.title === "Not started"), false);
});

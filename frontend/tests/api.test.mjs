import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

function mockFetch(response) {
  globalThis.fetch = async () => response;
}

test("api returns parsed JSON on success", async () => {
  mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  assert.deepEqual(await api("/health"), { ok: true });
});

test("api returns null on 204", async () => {
  mockFetch(new Response(null, { status: 204 }));
  assert.equal(await api("/x", { method: "DELETE" }), null);
});

test("api throws with status and detail on error", async () => {
  mockFetch(new Response(JSON.stringify({ detail: "Full" }), { status: 409 }));
  await assert.rejects(api("/enrollments"), (err) => {
    assert.equal(err.status, 409);
    assert.match(err.message, /HTTP 409: Full/);
    return true;
  });
});

import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

const originalFetch = globalThis.fetch;

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });

function mockFetch(handler) {
  globalThis.fetch = async (...args) => handler(...args);
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("GET thành công trả dữ liệu JSON", async () => {
  const rows = [{ class_id: "WEB-01", capacity: 40, enrolled: 39, remaining: 1 }];
  mockFetch(() => jsonResponse(rows));
  assert.deepEqual(await api("/sections"), rows);
});

test("POST gửi body JSON đúng và nhận 201", async () => {
  let captured;
  mockFetch((url, options) => {
    captured = { url, options };
    return jsonResponse({ message: "Dang ky thanh cong" }, 201);
  });
  const payload = { student_id: "22000004", class_section_id: "WEB-01" };
  const data = await api("/enrollments", { method: "POST", body: payload });

  assert.equal(data.message, "Dang ky thanh cong");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(captured.options.body), payload);
  assert.ok(captured.url.endsWith("/enrollments"));
});

test("DELETE 204 trả null, không đọc JSON", async () => {
  mockFetch(() => new Response(null, { status: 204 }));
  const data = await api("/enrollments/22000004/WEB-01", { method: "DELETE" });
  assert.equal(data, null);
});

test("404 ném lỗi có status và thông báo detail", async () => {
  mockFetch(() => jsonResponse({ detail: "Khong tim thay sinh vien" }, 404));
  await assert.rejects(api("/students/0/enrollments"), (error) => {
    assert.equal(error.status, 404);
    assert.match(error.message, /HTTP 404: Khong tim thay sinh vien/);
    return true;
  });
});

test("409 ném lỗi hết chỗ, giữ nguyên status", async () => {
  mockFetch(() => jsonResponse({ detail: "Lop hoc phan da het cho" }, 409));
  await assert.rejects(
    api("/enrollments", { method: "POST", body: {} }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /HTTP 409: Lop hoc phan da het cho/);
      return true;
    },
  );
});

test("422 nối các msg trong detail dạng mảng", async () => {
  mockFetch(() =>
    jsonResponse(
      { detail: [{ msg: "Field required" }, { msg: "Input should be a string" }] },
      422,
    ),
  );
  await assert.rejects(api("/enrollments", { method: "POST", body: {} }), (error) => {
    assert.equal(error.status, 422);
    assert.match(error.message, /HTTP 422: Field required; Input should be a string/);
    return true;
  });
});

test("phản hồi không phải JSON ném lỗi dễ hiểu", async () => {
  mockFetch(() => new Response("<html>Bad Gateway</html>", { status: 502 }));
  await assert.rejects(api("/sections"), /HTTP 502: phản hồi không phải JSON\./);
});

test("lỗi mạng ném thông báo kiểm tra Backend/CORS", async () => {
  mockFetch(() => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(api("/sections"), /Backend\/CORS/);
});

test("AbortError được ném lại nguyên vẹn", async () => {
  mockFetch(() => {
    throw new DOMException("The operation was aborted.", "AbortError");
  });
  await assert.rejects(api("/sections"), (error) => {
    assert.equal(error.name, "AbortError");
    return true;
  });
});

test("lỗi không có detail dùng thông báo mặc định", async () => {
  mockFetch(() => jsonResponse({}, 500));
  await assert.rejects(api("/sections"), /HTTP 500: Yêu cầu không thành công\./);
});
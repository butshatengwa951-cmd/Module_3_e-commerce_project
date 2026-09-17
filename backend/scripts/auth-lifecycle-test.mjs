const baseUrl = process.env.API_BASE_URL || "http://localhost:4040";
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const stokvelName = process.env.TEST_STOKVEL_NAME;

if (!email || !password || !stokvelName) {
  console.error("Missing TEST_USER_EMAIL, TEST_USER_PASSWORD or TEST_STOKVEL_NAME.");
  process.exit(2);
}

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
};

const assertStatus = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label}: expected HTTP ${expected}, received ${actual}`);
};

const uniqueEmail = `${Date.now()}-${email}`;

console.log(`Testing authentication lifecycle against ${baseUrl}`);

const signup = await request("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({
    full_name: "StockWell Integration Test",
    email: uniqueEmail,
    password,
    phone_number: "0000000000",
    stokvel_name: stokvelName,
  }),
});
assertStatus(signup.response.status, 201, "register");

const login = await request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: uniqueEmail, password }),
});
assertStatus(login.response.status, 200, "login");
if (!login.body?.token || !login.body?.refresh_token || !login.body?.session_id) throw new Error("login: missing access token, refresh token or session ID");

const accessToken = login.body.token;
const refreshToken = login.body.refresh_token;
const sessionId = login.body.session_id;

const protectedPage = await request("/api/users/member-dashboard", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
assertStatus(protectedPage.response.status, 200, "protected page");

const refreshed = await request("/api/auth/refresh", {
  method: "POST",
  body: JSON.stringify({ refresh_token: refreshToken, session_id: sessionId }),
});
assertStatus(refreshed.response.status, 200, "refresh");
if (!refreshed.body?.refresh_token || refreshed.body.refresh_token === refreshToken) throw new Error("refresh: refresh token was not rotated");

const invalidToken = await request("/api/users/member-dashboard", {
  headers: { Authorization: "Bearer definitely-not-a-valid-jwt" },
});
assertStatus(invalidToken.response.status, 401, "invalid token");

const logout = await request("/api/auth/logout", {
  method: "POST",
  body: JSON.stringify({ session_id: sessionId }),
});
assertStatus(logout.response.status, 200, "logout");

const refreshAfterLogout = await request("/api/auth/refresh", {
  method: "POST",
  body: JSON.stringify({ refresh_token: refreshed.body.refresh_token, session_id: sessionId }),
});
assertStatus(refreshAfterLogout.response.status, 401, "refresh after logout");

console.log("PASS register -> login -> protected page -> refresh -> invalid token -> logout -> revoked refresh session");

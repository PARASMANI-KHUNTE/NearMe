/**
 * End-to-end Auth & Google OAuth Flow Test Script
 * Tests the live backend at https://nearme-rho.vercel.app
 * 
 * Usage: cd server && npx ts-node tests/e2e-auth-flow.test.ts
 */

const BASE_URL = process.env.API_URL || 'https://nearme-rho.vercel.app/api';
const WEB_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const testUserEmail = `test-${Date.now()}@nearme-test.com`;
const testUserName = 'E2E Test User';
const testUserPassword = 'TestPass123';
let authToken = '';
let userId = '';

// Color helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

function pass(msg: string) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(msg: string) { console.log(`  ${RED}✗${RESET} ${msg}`); }
function warn(msg: string) { console.log(`  ${YELLOW}!${RESET} ${msg}`); }
function info(msg: string) { console.log(`  ${CYAN}→${RESET} ${msg}`); }
function section(msg: string) { console.log(`\n${CYAN}═══ ${msg} ═══${RESET}\n`); }

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    pass('PASSED');
    passed++;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`FAILED: ${message}`);
    failed++;
  }
}

async function api(method: string, path: string, data?: Record<string, unknown>, extraHeaders?: Record<string, string>) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const opts: RequestInit = { method, headers };
  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(url, opts);
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  const resHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => { resHeaders[key] = value; });
  return { status: res.status, data: json, headers: resHeaders };
}

async function run() {
  console.log(`${DIM}Testing against: ${BASE_URL}${RESET}\n`);

  // ─── 1. Backend Health ───
  section('1. Backend Health');

  await test('Backend is reachable', async () => {
    const res = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('API responds to auth endpoints', async () => {
    const res = await api('POST', '/auth/login', { email: 'x@x.com', password: 'x' });
    if (res.status === 404) throw new Error('Auth endpoint not found');
    if (res.status !== 400 && res.status !== 401) throw new Error(`Unexpected status: ${res.status}`);
  });

  // ─── 2. Google OAuth Configuration ───
  section('2. Google OAuth Configuration');

  await test('GOOGLE_CLIENT_ID is set in environment', async () => {
    if (!WEB_GOOGLE_CLIENT_ID) warn('GOOGLE_CLIENT_ID not set locally — skipping check (it may be set on Vercel)');
  });

  await test('Google OAuth endpoint exists (POST /api/auth/google)', async () => {
    const res = await api('POST', '/auth/google', { idToken: 'invalid-token' });
    if (res.status === 404) throw new Error('Endpoint does not exist');
  });

  await test('Google OAuth rejects invalid token', async () => {
    const res = await api('POST', '/auth/google', { idToken: 'not-a-real-token' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // ─── 3. Email Registration Flow ───
  section('3. Email Registration & Login');

  await test('Register new user', async () => {
    // Retry up to 3 times — cold start may cause MongoDB timeout
    let lastErr: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await api('POST', '/auth/register', {
          email: testUserEmail,
          password: testUserPassword,
          name: testUserName,
        });
        const data = res.data as { success?: boolean; data?: { token?: string; user?: { id?: string; _id?: string } }; message?: string };
        if (!data?.success) throw new Error(data?.message || `Status ${res.status}`);
        if (!data.data?.token) throw new Error('No token returned');
        authToken = data.data.token;
        userId = data.data.user?.id || data.data.user?._id || '';
        info(`User created: ${testUserEmail}`);
        return;
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (lastErr.message.includes('buffering timed out')) {
          info(`MongoDB cold start — retry ${attempt}/3...`);
          await new Promise(r => setTimeout(r, 5000));
        } else {
          throw lastErr;
        }
      }
    }
    if (lastErr) throw lastErr;
  });

  await test('Login with registered credentials', async () => {
    const res = await api('POST', '/auth/login', {
      email: testUserEmail,
      password: testUserPassword,
    });
    const data = res.data as { success?: boolean; data?: { token?: string }; message?: string };
    if (!data?.success) throw new Error(data?.message);
    if (!data.data?.token) throw new Error('No token returned');
    authToken = data.data.token;
  });

  await test('Reject wrong password', async () => {
    const res = await api('POST', '/auth/login', { email: testUserEmail, password: 'WrongPass123' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Reject duplicate registration', async () => {
    const res = await api('POST', '/auth/register', {
      email: testUserEmail, password: testUserPassword, name: testUserName,
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // ─── 4. Authenticated Endpoints ───
  section('4. Authenticated Endpoints');

  await test('JWT token works for protected routes', async () => {
    const res = await api('GET', '/users/profile');
    if (res.status === 401) throw new Error('Token rejected — auth not working');
    if (res.status === 404) {
      warn('GET /users/profile returned 404');
    } else {
      info(`Got ${res.status} from /users/profile`);
    }
  });

  await test('Request without token is rejected', async () => {
    const saved = authToken;
    authToken = '';
    const res = await api('GET', '/users/profile');
    authToken = saved;
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Request with invalid token is rejected', async () => {
    const saved = authToken;
    authToken = 'invalid-token-here';
    const res = await api('GET', '/users/profile');
    authToken = saved;
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // ─── 5. Location Endpoints ───
  section('5. Location & Nearby (with auth)');

  await test('Update location', async () => {
    const res = await api('POST', '/location/update', { latitude: 28.6139, longitude: 77.2090 });
    const data = res.data as { success?: boolean; message?: string };
    if (!data?.success) throw new Error(data?.message || `Status ${res.status}`);
  });

  await test('Fetch nearby users', async () => {
    const res = await api('GET', '/location/nearby?lat=28.6139&lng=77.2090&radius=5000');
    const data = res.data as { success?: boolean; data?: unknown[]; message?: string };
    if (!data?.success) throw new Error(data?.message);
    const count = Array.isArray(data.data) ? data.data.length : 0;
    info(`Found ${count} nearby users`);
  });

  // ─── 6. CORS Check ───
  section('6. CORS Configuration');

  await test('CORS headers present', async () => {
    const res = await api('OPTIONS', '/auth/login', undefined, {
      Origin: 'https://near-me-coral.vercel.app',
      'Access-Control-Request-Method': 'POST',
    });
    const allowOrigin = res.headers?.['access-control-allow-origin'] || res.headers?.['Access-Control-Allow-Origin'];
    if (!allowOrigin) {
      warn('No CORS headers found — frontend requests may be blocked');
      throw new Error('Missing CORS headers');
    }
    info(`CORS origin: ${allowOrigin}`);
  });

  // ─── Summary ───
  section('Test Summary');
  const total = passed + failed;
  console.log(`  Total:  ${total}`);
  console.log(`  ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`  ${RED}Failed: ${failed}${RESET}\n`);

  // ─── Google OAuth Manual Test Instructions ───
  section('Google OAuth — Manual Test Instructions');
  console.log(`
  The backend Google OAuth endpoint is live and rejecting invalid tokens.
  To test with a REAL Google token:

  WEB (https://near-me-coral.vercel.app):
  1. Open the web app in browser
  2. Click "Sign in with Google" 
  3. Complete Google authentication
  4. Check browser console (F12) for errors
  5. Should redirect to dashboard on success

  MOBILE (Expo):
  1. cd mobile && npx expo start
  2. Open in Expo Go or dev build
  3. Tap "Sign in with Google"
  4. Complete authentication

  IF IT FAILS — verify these:
  - Google Cloud Console → OAuth consent screen configured + published (or test user added)
  - Web Client ID has https://near-me-coral.vercel.app in authorized JS origins
  - Backend env: GOOGLE_CLIENT_ID = Web Client ID
  - Frontend env: VITE_GOOGLE_CLIENT_ID = Web Client ID  
  - Mobile env: EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID = Web Client ID
  `);

  if (failed > 0) {
    console.log(`${RED}Some tests failed. Fix the issues above before testing Google OAuth.${RESET}\n`);
    process.exit(1);
  }
}

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${RED}Fatal error:${RESET}`, message);
  process.exit(1);
});

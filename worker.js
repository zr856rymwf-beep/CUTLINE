const COOKIE_NAME = 'cutline_session'
const SESSION_MS = 1000 * 60 * 60 * 24 * 30
const RESET_MS = 1000 * 60 * 30
const RESET_COOLDOWN_MS = 1000 * 60
const encoder = new TextEncoder()
let schemaReady = false

const schemaSql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  current_weight REAL NOT NULL,
  target_weight REAL NOT NULL,
  fight_date TEXT NOT NULL,
  weigh_in_type TEXT NOT NULL DEFAULT 'same_day',
  water_cut_kg REAL NOT NULL DEFAULT 0,
  fight_mode INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS weight_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  weight REAL NOT NULL,
  recorded_on TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, recorded_on)
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS feedback_user_created_idx ON feedback(user_id, created_at);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  height_cm REAL NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  activity_level TEXT NOT NULL DEFAULT 'moderate',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS meal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  eaten_on TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS meal_entries_user_date_idx ON meal_entries(user_id, eaten_on);
CREATE TABLE IF NOT EXISTS exercise_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exercised_on TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '運動',
  calories REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS exercise_entries_user_date_idx ON exercise_entries(user_id, exercised_on);
CREATE TABLE IF NOT EXISTS condition_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  recorded_on TEXT NOT NULL,
  sleep_hours REAL NOT NULL,
  fatigue INTEGER NOT NULL,
  hunger INTEGER NOT NULL,
  training_intensity INTEGER NOT NULL,
  body_condition INTEGER NOT NULL,
  resting_heart_rate INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, recorded_on)
);
CREATE TABLE IF NOT EXISTS meal_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS meal_templates_user_created_idx ON meal_templates(user_id, created_at);
`

function nowIso() { return new Date().toISOString() }
function normalizeUsername(value) { return typeof value === 'string' ? value.trim().toLocaleLowerCase('ja-JP') : '' }
function normalizeEmail(value) { return typeof value === 'string' ? value.trim().toLowerCase() : '' }
function isValidEmail(value) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) }
function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}
function bytesToHex(bytes) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('') }
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}
function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return bytesToHex(arr)
}
async function sha256Hex(value) { return bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(value))) }
async function hashPassword(password) {
  const salt = randomHex(16)
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(salt), iterations: 210000 }, key, 256)
  return `pbkdf2$210000$${salt}$${bytesToHex(bits)}`
}
async function verifyPassword(password, encoded) {
  const [kind, iterText, salt, storedHex] = String(encoded || '').split('$')
  const iterations = Number(iterText)
  if (kind !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 100000 || !/^[a-f0-9]{32}$/i.test(salt || '') || !/^[a-f0-9]{64}$/i.test(storedHex || '')) return false
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(salt), iterations }, key, 256)
  const actual = new Uint8Array(bits)
  const stored = hexToBytes(storedHex)
  let diff = actual.length ^ stored.length
  for (let i = 0; i < Math.min(actual.length, stored.length); i++) diff |= actual[i] ^ stored[i]
  return diff === 0
}
function getCookie(request, name) {
  const raw = request.headers.get('cookie') || ''
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}
function sessionCookie(token, expires) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`
}
function deleteSessionCookie() { return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } })
}
async function ensureSchema(env) {
  if (schemaReady) return
  if (!env.DB) throw new Error('DB_NOT_CONFIGURED')
  await env.DB.exec(schemaSql)
  schemaReady = true
}
async function one(env, sql, ...params) { return await env.DB.prepare(sql).bind(...params).first() }
async function all(env, sql, ...params) { return (await env.DB.prepare(sql).bind(...params).all()).results || [] }
async function run(env, sql, ...params) { return await env.DB.prepare(sql).bind(...params).run() }

function mapPlan(row) {
  if (!row) return null
  return { id: row.id, userId: row.userId, currentWeight: row.currentWeight, targetWeight: row.targetWeight, fightDate: row.fightDate, weighInType: row.weighInType, waterCutKg: row.waterCutKg, fightMode: Boolean(row.fightMode), updatedAt: row.updatedAt }
}
function mapProfile(row) {
  if (!row) return null
  return { userId: row.userId, heightCm: row.heightCm, age: row.age, sex: row.sex, activityLevel: row.activityLevel, updatedAt: row.updatedAt }
}
async function dashboard(env, userId) {
  const plan = mapPlan(await one(env, `SELECT id, user_id AS userId, current_weight AS currentWeight, target_weight AS targetWeight, fight_date AS fightDate, weigh_in_type AS weighInType, water_cut_kg AS waterCutKg, fight_mode AS fightMode, updated_at AS updatedAt FROM plans WHERE user_id=? LIMIT 1`, userId))
  const profile = mapProfile(await one(env, `SELECT user_id AS userId, height_cm AS heightCm, age, sex, activity_level AS activityLevel, updated_at AS updatedAt FROM profiles WHERE user_id=? LIMIT 1`, userId))
  const records = await all(env, `SELECT id, weight, recorded_on AS recordedOn, note FROM weight_entries WHERE user_id=? ORDER BY recorded_on DESC, id DESC LIMIT 90`, userId)
  const meals = await all(env, `SELECT id, eaten_on AS eatenOn, meal_type AS mealType, name, calories, protein, fat, carbs FROM meal_entries WHERE user_id=? ORDER BY eaten_on DESC, id DESC LIMIT 180`, userId)
  const exercises = await all(env, `SELECT id, exercised_on AS exercisedOn, name, calories, source FROM exercise_entries WHERE user_id=? ORDER BY exercised_on DESC, id DESC LIMIT 180`, userId)
  const conditions = await all(env, `SELECT id, recorded_on AS recordedOn, sleep_hours AS sleepHours, fatigue, hunger, training_intensity AS trainingIntensity, body_condition AS bodyCondition, resting_heart_rate AS restingHeartRate, note FROM condition_entries WHERE user_id=? ORDER BY recorded_on DESC, id DESC LIMIT 90`, userId)
  const templates = await all(env, `SELECT id, meal_type AS mealType, name, calories, protein, fat, carbs FROM meal_templates WHERE user_id=? ORDER BY created_at DESC, id DESC LIMIT 50`, userId)
  return { plan, profile, records, meals, exercises, conditions, templates }
}
async function createSession(env, userId) {
  const token = randomHex(32)
  const expires = new Date(Date.now() + SESSION_MS)
  await run(env, `INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)`, crypto.randomUUID(), userId, await sha256Hex(token), expires.toISOString(), nowIso())
  return { token, expires }
}
async function currentUser(request, env) {
  const token = getCookie(request, COOKIE_NAME)
  if (!token) return null
  const hash = await sha256Hex(token)
  const match = await one(env, `SELECT users.id AS id, users.username AS username, users.email AS email, sessions.expires_at AS expiresAt FROM sessions JOIN users ON sessions.user_id=users.id WHERE sessions.token_hash=? LIMIT 1`, hash)
  if (!match) return null
  if (new Date(match.expiresAt).getTime() < Date.now()) {
    await run(env, `DELETE FROM sessions WHERE token_hash=?`, hash)
    return null
  }
  return match
}
function publicSiteOrigin(request, env) {
  const configured = String(env.PASSWORD_RESET_BASE_URL || '').trim()
  if (configured) { try { return new URL(configured).origin } catch {} }
  return new URL(request.url).origin
}
async function sendPasswordResetEmail(env, email, resetUrl) {
  const apiKey = String(env.RESEND_API_KEY || '').trim()
  const from = String(env.PASSWORD_RESET_FROM || '').trim()
  if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'User-Agent': 'CUTLINE/1.2-cloudflare' },
    body: JSON.stringify({
      from, to: [email], subject: 'CUTLINE パスワード再設定',
      text: `CUTLINEのパスワード再設定リクエストを受け付けました。\n\n30分以内に以下のリンクから新しいパスワードを設定してください。\n${resetUrl}\n\nこの操作に心当たりがない場合は、このメールを無視してください。`,
      html: `<p>CUTLINEのパスワード再設定リクエストを受け付けました。</p><p>30分以内に以下のボタンから新しいパスワードを設定してください。</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#b9e62e;color:#11150d;text-decoration:none;font-weight:800;border-radius:8px">パスワードを再設定</a></p><p style="font-size:12px;color:#666">この操作に心当たりがない場合は、このメールを無視してください。</p>`,
    }),
  })
  if (!response.ok) throw new Error('EMAIL_SEND_FAILED')
}

async function handleApi(request, env) {
  await ensureSchema(env)
  const path = new URL(request.url).pathname.replace('/api/cutline', '') || '/session'
  if (request.method !== 'GET' && !isSameOrigin(request)) return json({ error: '不正な送信元からのリクエストです。' }, 403)

  if (path === '/register' && request.method === 'POST') {
    const body = await request.json()
    const username = normalizeUsername(body.username)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    if (username.length < 3 || username.length > 30) return json({ error: 'ユーザー名は3〜30文字で入力してください。' }, 400)
    if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) return json({ error: 'ユーザー名に使用できない文字が含まれています。' }, 400)
    if (!isValidEmail(email)) return json({ error: 'メールアドレスを正しく入力してください。' }, 400)
    if (password.length < 8 || password.length > 128) return json({ error: 'パスワードは8〜128文字で入力してください。' }, 400)
    if (await one(env, `SELECT id FROM users WHERE username=? LIMIT 1`, username)) return json({ error: 'このユーザー名はすでに使われています。' }, 409)
    if (await one(env, `SELECT id FROM users WHERE email=? LIMIT 1`, email)) return json({ error: 'このメールアドレスはすでに登録されています。' }, 409)
    const id = crypto.randomUUID()
    await run(env, `INSERT INTO users (id,username,email,password_hash,created_at) VALUES (?,?,?,?,?)`, id, username, email, await hashPassword(password), nowIso())
    const session = await createSession(env, id)
    return json({ user: { id, username, email }, ...(await dashboard(env, id)) }, 201, { 'Set-Cookie': sessionCookie(session.token, session.expires) })
  }

  if (path === '/login' && request.method === 'POST') {
    const body = await request.json()
    const username = normalizeUsername(body.username)
    const password = typeof body.password === 'string' ? body.password : ''
    const account = await one(env, `SELECT id,username,email,password_hash AS passwordHash FROM users WHERE username=? LIMIT 1`, username)
    if (!account || !(await verifyPassword(password, account.passwordHash))) return json({ error: 'ユーザー名またはパスワードが違います。' }, 401)
    const session = await createSession(env, account.id)
    return json({ user: { id: account.id, username: account.username, email: account.email }, ...(await dashboard(env, account.id)) }, 200, { 'Set-Cookie': sessionCookie(session.token, session.expires) })
  }

  if (path === '/forgot-password' && request.method === 'POST') {
    const body = await request.json()
    const email = normalizeEmail(body.email)
    if (!isValidEmail(email)) return json({ error: 'メールアドレスを正しく入力してください。' }, 400)
    if (!String(env.RESEND_API_KEY || '').trim() || !String(env.PASSWORD_RESET_FROM || '').trim()) return json({ error: 'メール送信設定が未完了です。管理者に連絡してください。' }, 503)
    const account = await one(env, `SELECT id,email FROM users WHERE email=? LIMIT 1`, email)
    if (account) {
      const latest = await one(env, `SELECT created_at AS createdAt FROM password_reset_tokens WHERE user_id=? ORDER BY created_at DESC LIMIT 1`, account.id)
      if (!latest || Date.now() - new Date(latest.createdAt).getTime() >= RESET_COOLDOWN_MS) {
        await run(env, `DELETE FROM password_reset_tokens WHERE user_id=?`, account.id)
        const token = randomHex(32)
        const expires = new Date(Date.now() + RESET_MS)
        await run(env, `INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)`, crypto.randomUUID(), account.id, await sha256Hex(token), expires.toISOString(), nowIso())
        try { await sendPasswordResetEmail(env, email, `${publicSiteOrigin(request, env)}/?reset=${encodeURIComponent(token)}`) }
        catch (error) { await run(env, `DELETE FROM password_reset_tokens WHERE user_id=?`, account.id); throw error }
      }
    }
    return json({ message: '登録済みのメールアドレスであれば、再設定メールを送信しました。' })
  }

  if (path === '/reset-password' && request.method === 'POST') {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!/^[a-f0-9]{64}$/i.test(token)) return json({ error: '再設定リンクが無効です。' }, 400)
    if (password.length < 8 || password.length > 128) return json({ error: 'パスワードは8〜128文字で入力してください。' }, 400)
    const reset = await one(env, `SELECT id,user_id AS userId,expires_at AS expiresAt FROM password_reset_tokens WHERE token_hash=? LIMIT 1`, await sha256Hex(token))
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) {
      if (reset) await run(env, `DELETE FROM password_reset_tokens WHERE id=?`, reset.id)
      return json({ error: '再設定リンクの有効期限が切れているか、すでに使用されています。' }, 400)
    }
    await run(env, `UPDATE users SET password_hash=? WHERE id=?`, await hashPassword(password), reset.userId)
    await run(env, `DELETE FROM password_reset_tokens WHERE user_id=?`, reset.userId)
    await run(env, `DELETE FROM sessions WHERE user_id=?`, reset.userId)
    return json({ message: 'パスワードを変更しました。新しいパスワードでログインしてください。' }, 200, { 'Set-Cookie': deleteSessionCookie() })
  }

  if (path === '/logout' && request.method === 'POST') {
    const token = getCookie(request, COOKIE_NAME)
    if (token) await run(env, `DELETE FROM sessions WHERE token_hash=?`, await sha256Hex(token))
    return new Response(null, { status: 204, headers: { 'Set-Cookie': deleteSessionCookie(), 'Cache-Control': 'no-store' } })
  }

  const user = await currentUser(request, env)
  if (!user) return json({ error: 'ログインが必要です。' }, 401)

  if (path === '/session' && request.method === 'GET') return json({ user: { id: user.id, username: user.username, email: user.email }, ...(await dashboard(env, user.id)) })

  if (path === '/account/email' && request.method === 'PUT') {
    const body = await request.json()
    const email = normalizeEmail(body.email)
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    if (!isValidEmail(email)) return json({ error: 'メールアドレスを正しく入力してください。' }, 400)
    const account = await one(env, `SELECT id,username,email,password_hash AS passwordHash FROM users WHERE id=? LIMIT 1`, user.id)
    if (!account) return json({ error: 'アカウントが見つかりません。' }, 404)
    if (account.email && account.email !== email && !(await verifyPassword(currentPassword, account.passwordHash))) return json({ error: 'メールアドレスを変更するには現在のパスワードを入力してください。' }, 401)
    const duplicate = await one(env, `SELECT id FROM users WHERE email=? LIMIT 1`, email)
    if (duplicate && duplicate.id !== user.id) return json({ error: 'このメールアドレスはすでに登録されています。' }, 409)
    await run(env, `UPDATE users SET email=? WHERE id=?`, email, user.id)
    return json({ user: { id: user.id, username: user.username, email } })
  }

  if (path === '/plan' && request.method === 'PUT') {
    const body = await request.json()
    const currentWeight = Number(body.currentWeight), targetWeight = Number(body.targetWeight)
    const fightDate = typeof body.fightDate === 'string' ? body.fightDate : ''
    const weighInType = body.weighInType === 'day_before' ? 'day_before' : body.weighInType === 'same_day' || body.weighInType == null ? 'same_day' : ''
    const waterCutKg = body.waterCutKg == null ? 0 : Number(body.waterCutKg)
    const fightMode = body.fightMode === true
    const weighInDate = isValidIsoDate(fightDate) ? new Date(`${fightDate}T12:00:00+09:00`) : null
    if (weighInDate && weighInType === 'day_before') weighInDate.setDate(weighInDate.getDate() - 1)
    const weighInDateIso = weighInDate ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(weighInDate) : ''
    if (!(currentWeight >= 30 && currentWeight <= 300) || !(targetWeight >= 30 && targetWeight <= 300) || targetWeight >= currentWeight || !isValidIsoDate(fightDate) || fightDate < todayIso() || !weighInType || !(waterCutKg >= 0 && waterCutKg <= 15) || weighInDateIso < todayIso()) return json({ error: '体重・試合日・計量方法・水抜き予定を正しく入力してください。' }, 400)
    await run(env, `INSERT INTO plans (user_id,current_weight,target_weight,fight_date,weigh_in_type,water_cut_kg,fight_mode,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET current_weight=excluded.current_weight,target_weight=excluded.target_weight,fight_date=excluded.fight_date,weigh_in_type=excluded.weigh_in_type,water_cut_kg=excluded.water_cut_kg,fight_mode=excluded.fight_mode,updated_at=excluded.updated_at`, user.id, currentWeight, targetWeight, fightDate, weighInType, waterCutKg, fightMode ? 1 : 0, nowIso())
    return json({ plan: mapPlan(await one(env, `SELECT id,user_id AS userId,current_weight AS currentWeight,target_weight AS targetWeight,fight_date AS fightDate,weigh_in_type AS weighInType,water_cut_kg AS waterCutKg,fight_mode AS fightMode,updated_at AS updatedAt FROM plans WHERE user_id=?`, user.id)) })
  }

  if (path === '/profile' && request.method === 'PUT') {
    const body = await request.json()
    const heightCm = Number(body.heightCm), age = Number(body.age)
    const sex = typeof body.sex === 'string' ? body.sex : '', activityLevel = typeof body.activityLevel === 'string' ? body.activityLevel : ''
    if (!(heightCm >= 120 && heightCm <= 230) || !Number.isInteger(age) || age < 16 || age > 90 || !['male','female'].includes(sex) || !['sedentary','light','moderate','high','very_high'].includes(activityLevel)) return json({ error: 'プロフィール情報を正しく入力してください。' }, 400)
    await run(env, `INSERT INTO profiles (user_id,height_cm,age,sex,activity_level,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET height_cm=excluded.height_cm,age=excluded.age,sex=excluded.sex,activity_level=excluded.activity_level,updated_at=excluded.updated_at`, user.id, heightCm, age, sex, activityLevel, nowIso())
    return json({ profile: mapProfile(await one(env, `SELECT user_id AS userId,height_cm AS heightCm,age,sex,activity_level AS activityLevel,updated_at AS updatedAt FROM profiles WHERE user_id=?`, user.id)) })
  }

  if (path === '/meals' && request.method === 'POST') {
    const body = await request.json(), eatenOn = typeof body.eatenOn === 'string' ? body.eatenOn : '', mealType = typeof body.mealType === 'string' ? body.mealType : 'snack', name = typeof body.name === 'string' ? body.name.trim().slice(0,80) : ''
    const calories = Number(body.calories), protein = Number(body.protein ?? 0), fat = Number(body.fat ?? 0), carbs = Number(body.carbs ?? 0)
    if (!isValidIsoDate(eatenOn) || eatenOn > todayIso() || !['breakfast','lunch','dinner','snack'].includes(mealType) || name.length < 1 || !(calories >= 0 && calories <= 10000) || [protein,fat,carbs].some(v => !(v >= 0 && v <= 1000))) return json({ error: '食事内容と栄養値を正しく入力してください。' }, 400)
    const result = await run(env, `INSERT INTO meal_entries (user_id,eaten_on,meal_type,name,calories,protein,fat,carbs,created_at) VALUES (?,?,?,?,?,?,?,?,?)`, user.id,eatenOn,mealType,name,calories,protein,fat,carbs,nowIso())
    const meal = await one(env, `SELECT id,eaten_on AS eatenOn,meal_type AS mealType,name,calories,protein,fat,carbs FROM meal_entries WHERE id=? AND user_id=?`, result.meta.last_row_id, user.id)
    return json({ meal }, 201)
  }

  if (path === '/exercises' && request.method === 'POST') {
    const body = await request.json(), exercisedOn = typeof body.exercisedOn === 'string' ? body.exercisedOn : '', name = typeof body.name === 'string' ? body.name.trim().slice(0,80) : '運動', calories = Number(body.calories)
    if (!isValidIsoDate(exercisedOn) || exercisedOn > todayIso() || name.length < 1 || !(calories > 0 && calories <= 10000)) return json({ error: '運動内容と消費カロリーを正しく入力してください。' }, 400)
    const result = await run(env, `INSERT INTO exercise_entries (user_id,exercised_on,name,calories,source,created_at) VALUES (?,?,?,?,?,?)`, user.id,exercisedOn,name,calories,'manual',nowIso())
    return json({ exercise: await one(env, `SELECT id,exercised_on AS exercisedOn,name,calories,source FROM exercise_entries WHERE id=? AND user_id=?`, result.meta.last_row_id,user.id) }, 201)
  }

  if (path === '/records' && request.method === 'POST') {
    const body = await request.json(), weight = Number(body.weight), recordedOn = typeof body.recordedOn === 'string' ? body.recordedOn : '', note = typeof body.note === 'string' ? body.note.trim().slice(0,120) : ''
    if (!(weight >= 30 && weight <= 300) || !isValidIsoDate(recordedOn) || recordedOn > todayIso()) return json({ error: '体重と日付を正しく入力してください。' }, 400)
    await run(env, `INSERT INTO weight_entries (user_id,weight,recorded_on,note,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,recorded_on) DO UPDATE SET weight=excluded.weight,note=excluded.note,created_at=excluded.created_at`, user.id,weight,recordedOn,note,nowIso())
    await run(env, `UPDATE plans SET current_weight=?,updated_at=? WHERE user_id=?`, weight,nowIso(),user.id)
    return json({ record: await one(env, `SELECT id,weight,recorded_on AS recordedOn,note FROM weight_entries WHERE user_id=? AND recorded_on=?`, user.id,recordedOn) }, 201)
  }

  if (path === '/conditions' && request.method === 'POST') {
    const body = await request.json(), recordedOn = typeof body.recordedOn === 'string' ? body.recordedOn : '', sleepHours=Number(body.sleepHours), fatigue=Number(body.fatigue), hunger=Number(body.hunger), trainingIntensity=Number(body.trainingIntensity), bodyCondition=Number(body.bodyCondition), restingHeartRate=body.restingHeartRate===''||body.restingHeartRate==null?null:Number(body.restingHeartRate), note=typeof body.note==='string'?body.note.trim().slice(0,160):''
    const ratings=[fatigue,hunger,trainingIntensity,bodyCondition]
    if (!isValidIsoDate(recordedOn)||recordedOn>todayIso()||!(sleepHours>=0&&sleepHours<=16)||ratings.some(v=>!Number.isInteger(v)||v<1||v>5)||(restingHeartRate!==null&&(!Number.isInteger(restingHeartRate)||restingHeartRate<30||restingHeartRate>220))) return json({ error: 'コンディション内容を正しく入力してください。' },400)
    await run(env, `INSERT INTO condition_entries (user_id,recorded_on,sleep_hours,fatigue,hunger,training_intensity,body_condition,resting_heart_rate,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,recorded_on) DO UPDATE SET sleep_hours=excluded.sleep_hours,fatigue=excluded.fatigue,hunger=excluded.hunger,training_intensity=excluded.training_intensity,body_condition=excluded.body_condition,resting_heart_rate=excluded.resting_heart_rate,note=excluded.note,created_at=excluded.created_at`, user.id,recordedOn,sleepHours,fatigue,hunger,trainingIntensity,bodyCondition,restingHeartRate,note,nowIso())
    return json({ condition: await one(env, `SELECT id,recorded_on AS recordedOn,sleep_hours AS sleepHours,fatigue,hunger,training_intensity AS trainingIntensity,body_condition AS bodyCondition,resting_heart_rate AS restingHeartRate,note FROM condition_entries WHERE user_id=? AND recorded_on=?`, user.id,recordedOn) },201)
  }

  if (path === '/templates' && request.method === 'POST') {
    const body=await request.json(), mealType=typeof body.mealType==='string'?body.mealType:'snack', name=typeof body.name==='string'?body.name.trim().slice(0,80):'', calories=Number(body.calories), protein=Number(body.protein??0), fat=Number(body.fat??0), carbs=Number(body.carbs??0)
    if (!['breakfast','lunch','dinner','snack'].includes(mealType)||name.length<1||!(calories>=0&&calories<=10000)||[protein,fat,carbs].some(v=>!(v>=0&&v<=1000))) return json({ error:'テンプレート内容を正しく入力してください。'},400)
    const result=await run(env,`INSERT INTO meal_templates (user_id,meal_type,name,calories,protein,fat,carbs,created_at) VALUES (?,?,?,?,?,?,?,?)`,user.id,mealType,name,calories,protein,fat,carbs,nowIso())
    return json({template:await one(env,`SELECT id,meal_type AS mealType,name,calories,protein,fat,carbs FROM meal_templates WHERE id=? AND user_id=?`,result.meta.last_row_id,user.id)},201)
  }

  if (path === '/feedback' && request.method === 'POST') {
    const body=await request.json(), category=typeof body.category==='string'?body.category:'', message=typeof body.message==='string'?body.message.trim():''
    if (!['使いやすさ','機能の要望','不具合','その他'].includes(category)) return json({error:'意見の種類を選択してください。'},400)
    if (message.length<3||message.length>1000) return json({error:'内容は3〜1000文字で入力してください。'},400)
    await run(env,`INSERT INTO feedback (user_id,category,message,created_at) VALUES (?,?,?,?)`,user.id,category,message,nowIso())
    return json({message:'ご意見を受け付けました。ありがとうございます。'},201)
  }

  let match=path.match(/^\/conditions\/(\d+)$/)
  if (match&&request.method==='DELETE'){await run(env,`DELETE FROM condition_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
  match=path.match(/^\/templates\/(\d+)$/)
  if (match&&request.method==='DELETE'){await run(env,`DELETE FROM meal_templates WHERE id=? AND user_id=?`,Number(match[1]),user.id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
  match=path.match(/^\/meals\/(\d+)$/)
  if (match&&request.method==='PUT'){
    const body=await request.json(), eatenOn=typeof body.eatenOn==='string'?body.eatenOn:'',mealType=typeof body.mealType==='string'?body.mealType:'snack',name=typeof body.name==='string'?body.name.trim().slice(0,80):'',calories=Number(body.calories),protein=Number(body.protein??0),fat=Number(body.fat??0),carbs=Number(body.carbs??0)
    if(!isValidIsoDate(eatenOn)||eatenOn>todayIso()||!['breakfast','lunch','dinner','snack'].includes(mealType)||name.length<1||!(calories>=0&&calories<=10000)||[protein,fat,carbs].some(v=>!(v>=0&&v<=1000))) return json({error:'食事内容と栄養値を正しく入力してください。'},400)
    const existing=await one(env,`SELECT id FROM meal_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id);if(!existing)return json({error:'食事記録が見つかりません。'},404)
    await run(env,`UPDATE meal_entries SET eaten_on=?,meal_type=?,name=?,calories=?,protein=?,fat=?,carbs=? WHERE id=? AND user_id=?`,eatenOn,mealType,name,calories,protein,fat,carbs,Number(match[1]),user.id)
    return json({meal:await one(env,`SELECT id,eaten_on AS eatenOn,meal_type AS mealType,name,calories,protein,fat,carbs FROM meal_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id)})
  }
  if (match&&request.method==='DELETE'){await run(env,`DELETE FROM meal_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
  match=path.match(/^\/exercises\/(\d+)$/)
  if (match&&request.method==='DELETE'){await run(env,`DELETE FROM exercise_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
  match=path.match(/^\/records\/(\d+)$/)
  if (match&&request.method==='DELETE'){await run(env,`DELETE FROM weight_entries WHERE id=? AND user_id=?`,Number(match[1]),user.id);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}

  return json({ error: 'ページが見つかりません。' }, 404)
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api/cutline')) return await handleApi(request, env)
      return env.ASSETS.fetch(request)
    } catch (error) {
      console.error('CUTLINE Worker error', error)
      if (error instanceof Error && error.message === 'EMAIL_SEND_FAILED') return json({ error: '再設定メールを送信できませんでした。メール送信設定を確認してください。' }, 502)
      if (error instanceof Error && error.message === 'EMAIL_NOT_CONFIGURED') return json({ error: 'メール送信設定が未完了です。管理者に連絡してください。' }, 503)
      if (error instanceof Error && error.message === 'DB_NOT_CONFIGURED') return json({ error: 'データベース設定が未完了です。Cloudflare D1 を DB として接続してください。' }, 503)
      return json({ error: '処理を完了できませんでした。時間をおいて再度お試しください。' }, 500)
    }
  },
}

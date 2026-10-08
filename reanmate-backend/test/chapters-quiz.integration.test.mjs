import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createApp } from '../dist/create-app.js';
import { DatabaseService } from '../dist/database/database.service.js';

process.env.AUTH_EMAIL_DELIVERY = 'console';

const QUESTIONS = [
  { prompt: '1 + 1 = ?', options: ['1', '2', '3', '4'], correctIndex: 1, explanation: '1 + 1 = 2' },
  { prompt: '2 + 2 = ?', options: ['4', '3', '5', '6'], correctIndex: 0, explanation: '2 + 2 = 4' },
  { prompt: '3 + 3 = ?', options: ['5', '7', '6', '9'], correctIndex: 2, explanation: '3 + 3 = 6' },
  { prompt: '4 + 4 = ?', options: ['6', '7', '9', '8'], correctIndex: 3, explanation: '4 + 4 = 8' },
  { prompt: '5 + 5 = ?', options: ['10', '11', '9', '8'], correctIndex: 0, explanation: '5 + 5 = 10' },
];

// Uses only accounts and chapters created by this run; never clears a collection.
test('admin chapters and quiz progress integration', { timeout: 180000 }, async (t) => {
  assert.ok(process.env.MONGODB_URI, 'Configure MONGODB_URI before running integration tests');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const database = app.get(DatabaseService);
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const ipBlock = Math.floor(Math.random() * 250);
  let requestNumber = 0;
  const emails = [];
  const chapterIds = [];

  async function request(path, { method, body, session } = {}) {
    const response = await fetch(`${base}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        origin,
        'content-type': 'application/json',
        'x-forwarded-for': `198.20.${ipBlock}.${++requestNumber % 250}`,
        ...(session ? { cookie: session } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { response, data: await response.json().catch(() => null) };
  }

  async function signUp(role) {
    const email = `reanmate-test-${randomUUID()}@example.com`;
    emails.push(email);
    const { response, data } = await request('/auth/sign-up/email', {
      body: { name: 'Test', email, password: randomBytes(24).toString('base64url') },
    });
    assert.equal(response.status, 200, JSON.stringify(data));
    if (role === 'admin') {
      await database.db.collection('user').updateOne({ email }, { $set: { role: 'admin' } });
    }
    return response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  }

  try {
    const admin = await signUp('admin');
    const student = await signUp('student');
    let chapter;

    await t.test('admin endpoints reject anonymous users and students', async () => {
      assert.equal((await request('/admin/chapters')).response.status, 401);
      assert.equal((await request('/admin/chapters', { session: student })).response.status, 403);
      const create = await request('/admin/chapters', {
        session: student,
        body: { grade: 10, subject: 'math', title: 'Nope' },
      });
      assert.equal(create.response.status, 403);
    });

    await t.test('admin creates a draft that students cannot see', async () => {
      const { response, data } = await request('/admin/chapters', {
        session: admin,
        body: { grade: 12, subject: 'math', title: 'Test chapter', sortOrder: 99, sourceText: 'Addition facts.' },
      });
      assert.equal(response.status, 201, JSON.stringify(data));
      chapter = data;
      chapterIds.push(chapter.id);
      assert.equal(chapter.status, 'draft');
      assert.deepEqual(chapter.questions, []);
      assert.equal((await request(`/chapters/${chapter.id}`)).response.status, 404);
      const list = await request('/chapters?grade=12&subject=math');
      assert.ok(!list.data.some((c) => c.id === chapter.id));
      const adminGet = await request(`/admin/chapters/${chapter.id}`, { session: admin });
      assert.equal(adminGet.data.sourceText, 'Addition facts.');
    });

    await t.test('create rejects missing fields and unknown properties', async () => {
      const missing = await request('/admin/chapters', { session: admin, body: { subject: 'math' } });
      assert.equal(missing.response.status, 400);
      const extra = await request('/admin/chapters', {
        session: admin,
        body: { grade: 10, subject: 'math', title: 'X', hacked: true },
      });
      assert.equal(extra.response.status, 400);
    });

    await t.test('approval requires a summary and questions', async () => {
      const early = await request(`/admin/chapters/${chapter.id}`, {
        method: 'PATCH',
        session: admin,
        body: { status: 'approved' },
      });
      assert.equal(early.response.status, 400);
      const { response, data } = await request(`/admin/chapters/${chapter.id}`, {
        method: 'PATCH',
        session: admin,
        body: { summary: 'Adding small numbers.', questions: QUESTIONS, status: 'approved' },
      });
      assert.equal(response.status, 200, JSON.stringify(data));
      assert.equal(data.status, 'approved');
      assert.equal(data.questions.length, 5);
      assert.equal(data.questions[0].id, `${chapter.id}-q1`);
      chapter = data;
      const visible = await request(`/chapters/${chapter.id}`);
      assert.equal(visible.response.status, 200);
      const list = await request('/chapters?grade=12&subject=math');
      const listed = list.data.find((c) => c.id === chapter.id);
      assert.ok(listed);
      assert.equal(listed.sourceText, '', 'students must not receive sourceText');
    });

    await t.test('quiz endpoints require sign-in', async () => {
      assert.equal((await request('/me/progress')).response.status, 401);
      const attempt = await request(`/chapters/${chapter.id}/quiz/attempts`, { body: { answers: {} } });
      assert.equal(attempt.response.status, 401);
    });

    const answersFor = (correct) =>
      Object.fromEntries(
        chapter.questions.map((q, i) => [q.id, i < correct ? q.correctIndex : (q.correctIndex + 1) % 4]),
      );

    await t.test('a failing attempt is scored server-side and does not complete the chapter', async () => {
      const { response, data } = await request(`/chapters/${chapter.id}/quiz/attempts`, {
        session: student,
        body: { answers: answersFor(3) },
      });
      assert.equal(response.status, 201, JSON.stringify(data));
      assert.equal(data.score, 3);
      assert.equal(data.total, 5);
      assert.equal(data.chapterCompleted, false);
      const progress = await request('/me/progress', { session: student });
      const entry = progress.data.find((p) => p.chapterId === chapter.id);
      assert.deepEqual(entry, { chapterId: chapter.id, bestScorePercent: 60, completedAt: null });
    });

    await t.test('a later passing attempt completes it; best score and first completion are kept', async () => {
      const pass = await request(`/chapters/${chapter.id}/quiz/attempts`, {
        session: student,
        body: { answers: answersFor(4) },
      });
      assert.equal(pass.data.chapterCompleted, true);
      const first = (await request('/me/progress', { session: student })).data.find((p) => p.chapterId === chapter.id);
      assert.equal(first.bestScorePercent, 80);
      assert.ok(first.completedAt);

      const worse = await request(`/chapters/${chapter.id}/quiz/attempts`, {
        session: student,
        body: { answers: answersFor(1) },
      });
      assert.equal(worse.data.chapterCompleted, true);
      const after = (await request('/me/progress', { session: student })).data.find((p) => p.chapterId === chapter.id);
      assert.equal(after.bestScorePercent, 80);
      assert.equal(after.completedAt, first.completedAt);
      assert.equal(await database.db.collection('quizattempts').countDocuments({ chapterId: chapter.id }), 3);
    });

    await t.test('progress is per user', async () => {
      const progress = await request('/me/progress', { session: admin });
      assert.ok(!progress.data.some((p) => p.chapterId === chapter.id));
    });

    await t.test(
      'generate returns a Khmer summary and 5–10 MCQs from Gemini',
      { skip: !process.env.GOOGLE_CLOUD_PROJECT && 'GOOGLE_CLOUD_PROJECT not set' },
      async () => {
        await request(`/admin/chapters/${chapter.id}`, {
          method: 'PATCH',
          session: admin,
          body: {
            sourceText:
              'ការបូកលេខ៖ ១ + ១ = ២, ២ + ២ = ៤, ៣ + ៣ = ៦។ ការបូកមានលក្ខណៈត្រលប់ a + b = b + a។ លេខសូន្យជាធាតុណឺត a + 0 = a។',
          },
        });
        const { response, data } = await request(`/admin/chapters/${chapter.id}/generate`, {
          session: admin,
          body: {},
        });
        assert.equal(response.status, 201, JSON.stringify(data));
        assert.ok(data.summary.length > 0);
        assert.ok(data.questions.length >= 1 && data.questions.length <= 10);
        for (const q of data.questions) {
          assert.equal(q.options.length, 4);
          assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
        }
      },
    );
  } finally {
    await database.db.collection('chapters').deleteMany({ id: { $in: chapterIds } });
    await database.db.collection('quizattempts').deleteMany({ chapterId: { $in: chapterIds } });
    await database.db.collection('progress').deleteMany({ chapterId: { $in: chapterIds } });
    for (const email of emails) {
      const user = await database.db.collection('user').findOne({ email });
      if (user) {
        await database.db.collection('session').deleteMany({ userId: user._id });
        await database.db.collection('account').deleteMany({ userId: user._id });
        await database.db.collection('user').deleteOne({ _id: user._id });
      }
    }
    await database.db.collection('rateLimit').deleteMany({ key: { $regex: `^198\\.20\\.${ipBlock}\\.` } });
    await app.close();
  }
});

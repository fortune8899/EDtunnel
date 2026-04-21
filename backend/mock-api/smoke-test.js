const { spawn } = require('child_process');

const BASE = 'http://localhost:8788';

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function jfetch(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) {
    throw new Error(`${path} failed: ${JSON.stringify(body)}`);
  }
  return body.data;
}

async function main() {
  const proc = spawn(process.execPath, ['backend/mock-api/server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', () => {});
  proc.stderr.on('data', () => {});

  try {
    await sleep(700);

    await jfetch('/api/v1/admin/reset', { method: 'POST' });

    const created = await jfetch('/api/v1/eval-records', {
      method: 'POST',
      body: JSON.stringify({
        eval_date: '2026-04-19',
        location: '自动化测试地点',
        project_name: '自动化测试项目',
        source_platform: '市公共资源交易中心',
        role_in_group: 1,
        profession_code: 'A010101',
        expected_fee: 1000,
        settlement_status: 0,
      }),
    });

    if (!created.id) throw new Error('create response missing id');

    const listed = await jfetch('/api/v1/eval-records?page=1&pageSize=10');
    if (!listed.total || listed.total < 1) throw new Error('list total invalid');

    await jfetch(`/api/v1/eval-records/${created.id}/settlement`, {
      method: 'PATCH',
      body: JSON.stringify({
        settlement_status: 1,
        actual_paid_amount: 1000,
        paid_date: '2026-04-20',
      }),
    });

    const overview = await jfetch('/api/v1/dashboard/year-overview?year=2026');
    if (overview.total_eval_count < 1) throw new Error('dashboard overview invalid');

    console.log('mock-api smoke test passed');
  } finally {
    proc.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

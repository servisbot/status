// scripts/checkStatus.js
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const FILE = path.resolve(__dirname, '..', 'status.json');

function fetchUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'GET', timeout }, (res) => {
        const statusCode = res.statusCode;
        res.resume();
        resolve({ statusCode });
      });
      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

function svcStatusFromResponse(res) {
  if (res.error) return 'DOWN';
  const code = res.statusCode || 0;
  if (code >= 200 && code < 300) return 'OK';
  if (code >= 300 && code < 500) return 'DEGRADED';
  return 'DOWN';
}

function overallFromRegions(regions) {
  // priorities: DOWN > DEGRADED > OPERATIONAL
  let worst = 'OPERATIONAL';
  for (const r of regions) {
    for (const s of (r.services || [])) {
      const st = (s.status || '').toUpperCase();
      if (st === 'DOWN') return 'DOWN';
      if (st === 'DEGRADED') worst = 'DEGRADED';
    }
  }
  return worst;
}

(async () => {
  let data;
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.log('status.json not found or invalid. Creating a minimal template.');
    data = { status: 'OPERATIONAL', timestamp: new Date().toISOString(), contact: '', affected_regions: [], timeline: [] };
  }

  const oldOverall = (data.status || '').toUpperCase();

  for (const region of (data.affected_regions || [])) {
    for (const svc of (region.services || [])) {
      if (svc.checkUrl) {
        try {
          const res = await fetchUrl(svc.checkUrl, 8000);
          const newStatus = svcStatusFromResponse(res);
          svc.status = newStatus;
        } catch (e) {
          svc.status = 'DOWN';
        }
      } else {
        // leave existing status as-is for manual-managed services
        svc.status = (svc.status || 'UNKNOWN');
      }
      svc.lastChecked = new Date().toISOString();
    }
  }

  const newOverall = overallFromRegions(data.affected_regions || []);
  data.status = newOverall;
  data.timestamp = new Date().toISOString();

  if (!Array.isArray(data.timeline)) data.timeline = [];
  if (newOverall !== oldOverall) {
    data.timeline.push({
      time: new Date().toISOString(),
      status: `Overall status changed from ${oldOverall || 'UNKNOWN'} to ${newOverall}`
    });
    // keep timeline manageable
    if (data.timeline.length > 200) data.timeline = data.timeline.slice(-200);
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('status.json updated: overall =', data.status);
})();

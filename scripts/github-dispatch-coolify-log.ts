/**
 * Trigger GitHub Actions to fetch Coolify deploy log.
 * Use as Coolify Notification Webhook URL handler (run on a machine with secrets),
 * or call manually after deploy.
 *
 * Requires env:
 *   GITHUB_TOKEN — PAT with repo + workflow scope
 *   GITHUB_REPO  — e.g. artificialxflow/nexaapoint18khordad
 *
 * Coolify webhook POST body is forwarded as client_payload.
 */

const TOKEN = process.env.GITHUB_TOKEN ?? '';
const REPO = process.env.GITHUB_REPO ?? 'artificialxflow/nexaapoint18khordad';
const EVENT = process.env.GITHUB_DISPATCH_EVENT ?? 'coolify-deploy-failed';

async function main() {
  if (!TOKEN) {
    console.error('Missing GITHUB_TOKEN');
    process.exit(1);
  }

  const [owner, repo] = REPO.split('/');
  const payload = process.argv[2] ? JSON.parse(process.argv[2]) : { source: 'manual', at: new Date().toISOString() };

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      event_type: EVENT,
      client_payload: payload,
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }

  console.log(`[github-dispatch] triggered ${EVENT} on ${REPO}`);
}

main();

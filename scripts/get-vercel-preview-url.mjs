#!/usr/bin/env node

import { appendFileSync } from 'node:fs';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function fetchPreviewDeployment() {
  const token = requireEnv('VERCEL_TOKEN');
  const teamId = requireEnv('VERCEL_TEAM_ID');
  const projectId = requireEnv('VERCEL_PROJECT_ID');

  const branch =
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    process.env.GITHUB_REF?.replace('refs/heads/', '');

  if (!branch) {
    throw new Error('Unable to determine branch from GitHub context.');
  }

  const commitSha = process.env.GITHUB_SHA;

  const apiVersion = process.env.VERCEL_DEPLOYMENTS_API_VERSION || 'v6';
  const url = new URL(`https://api.vercel.com/${apiVersion}/deployments`);
  url.searchParams.set('teamId', teamId);
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('target', 'preview');
  url.searchParams.set('limit', '20');
  url.searchParams.set('meta-githubCommitRef', branch);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API request failed: ${response.status} ${response.statusText} — ${body}`);
  }

  const payload = await response.json();
  const deployments = payload?.deployments ?? payload?.results ?? [];

  if (!Array.isArray(deployments) || deployments.length === 0) {
    throw new Error(`No preview deployments found for branch "${branch}".`);
  }

  const deployment =
    deployments.find((item) => item.meta?.githubCommitSha === commitSha && item.readyState === 'READY') ??
    deployments.find((item) => item.readyState === 'READY');

  if (!deployment?.url) {
    throw new Error(`No READY preview deployment available for branch "${branch}".`);
  }

  return deployment.url.startsWith('https://') ? deployment.url : `https://${deployment.url}`;
}

async function main() {
  try {
    const previewUrl = await fetchPreviewDeployment();
    console.log(`Preview URL: ${previewUrl}`);

    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${previewUrl}\n`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

await main();

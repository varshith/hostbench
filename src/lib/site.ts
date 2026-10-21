export const SITE_NAME = 'HostBench';
export const SITE_TAGLINE = 'Hourly multi-region benchmark of static, edge and PaaS hosting platforms';
export const REPO_URL = 'https://github.com/varshith/hostbench';

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

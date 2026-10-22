import type { APIRoute } from 'astro';
import { sharedTips } from '../../lib/db/community';

export const GET: APIRoute = () => Response.json({ tips: sharedTips(), login: null });

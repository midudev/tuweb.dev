import type { APIRoute } from 'astro';
import { highlightCounts } from '../../lib/db/community';

export const GET: APIRoute = () => Response.json({ ...highlightCounts(), mine: [], login: null });

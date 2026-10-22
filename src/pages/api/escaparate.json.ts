import type { APIRoute } from 'astro';
import { sharedProjects } from '../../lib/db/community';

export const GET: APIRoute = () => Response.json({ projects: sharedProjects(), login: null });

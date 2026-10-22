import type { APIRoute, GetStaticPaths } from 'astro';
import { highlightComments, shippedFeatureIds } from '../../../lib/db/community';

export const getStaticPaths = (() =>
	shippedFeatureIds().map((id) => ({ params: { idea: String(id) } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => Response.json({ comments: highlightComments(Number(params.idea)) });

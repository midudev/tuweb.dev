import type { APIRoute } from 'astro';
import { lastRetoWeek, retosOfWeek } from '../../lib/db/community';
import { nextWeekStart, weekIndex, weekStart } from '../../lib/retos';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * La última semana con retos de la gente, que es la que había al parar. Sin
 * ninguno, la de cuando se compiló la web.
 */
function frozenWeek() {
	const last = lastRetoWeek();
	const start = last === null ? weekStart(Date.now()) : weekStart(Date.UTC(1970, 0, 5) + last * WEEK + WEEK / 2);
	return { start, index: weekIndex(start), end: nextWeekStart(start) };
}

export const GET: APIRoute = () => {
	const week = frozenWeek();
	return Response.json({
		week: week.index,
		start: week.start,
		end: week.end,
		retos: retosOfWeek(week.index),
		login: null,
	});
};

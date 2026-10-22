export type SessionUser = {
	id: number;
	githubId: number;
	login: string;
	name: string | null;
	avatarUrl: string;
};

/**
 * La web archivada no tiene sesión: es estática y nadie puede entrar con GitHub.
 * Las páginas siguen preguntando para pintarse igual que se pintaban a quien
 * llegaba sin cuenta.
 */
export async function getSessionUser(_context?: unknown): Promise<SessionUser | null> {
	return null;
}

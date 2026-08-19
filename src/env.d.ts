/// <reference types="astro/client" />

declare namespace App {
	interface SessionData {
		user: {
			id: number;
			githubId: number;
			login: string;
			name: string | null;
			avatarUrl: string;
		};
	}
}

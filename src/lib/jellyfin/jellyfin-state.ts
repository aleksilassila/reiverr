import { writable } from 'svelte/store';

async function fetchJellyfinState() {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve('true'), 2000);
	});
}

export const jellyfinState = writable(fetchJellyfinState());

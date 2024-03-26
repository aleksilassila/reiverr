import { writable } from 'svelte/store';
import type { components } from '../apis/reiverr/reiverr.generated';

export type User = components['schemas']['UserDto'];

export const userStore = writable<User | null>(undefined);

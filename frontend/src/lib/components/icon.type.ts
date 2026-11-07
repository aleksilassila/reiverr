import type { Component, ComponentType, SvelteComponent } from 'svelte';

type IconProps = { size?: number; class?: string };

/**
 * An icon component: one of ours, or one of radix-icons-svelte, whose package types its icons as
 * the component classes of Svelte 4, which `Component` does not cover
 */
export type IconComponent = Component<IconProps> | ComponentType<SvelteComponent<IconProps>>;

<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';
	import { localSettings } from '../stores/localstorage.store';
	import { inputMode } from '$lib/stores/input-mode.store';

	type Props = SvelteHTMLElements['div'] & {
		hasFocus: boolean;
		enabled?: boolean;
		children?: Snippet;
	};

	let { hasFocus, enabled = true, children, ...rest }: Props = $props();
	let useTransitions = $derived($localSettings.useCssTransitions);
</script>

<div
	{...rest}
	style={useTransitions ? 'transition: transform 200ms; ' : ''}
	class={classNames(
		'relative',
		{
			'scale-105': hasFocus && $inputMode,
			'hover:scale-105': useTransitions && enabled
			// 'transition-all': enabled
		},
		rest.class
	)}
>
	{@render children?.()}
</div>

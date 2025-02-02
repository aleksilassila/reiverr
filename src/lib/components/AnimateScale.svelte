<script lang="ts">
	import classNames from 'classnames';
	import { localSettings } from '../stores/localstorage.store';

	export let hasFocus: boolean;
	export let enabled = true;
	let useTransitions = true;
	localSettings.subscribe((v) => (useTransitions = v.useCssTransitions));
</script>

<div
	{...$$restProps}
	style={useTransitions ? 'transition: transform 200ms;' : ''}
	class={classNames(
		'relative',
		{
			'scale-105': hasFocus,
			'hover:scale-105': useTransitions && enabled
			// 'transition-all': enabled
		},
		$$restProps.class
	)}
>
	<slot />
</div>

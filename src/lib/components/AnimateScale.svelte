<script lang="ts">
	import classNames from 'classnames';
	import { localSettings } from '../stores/localstorage.store';

	export let hasFocus: boolean;
	let enabled = true;
	localSettings.subscribe((v) => (enabled = v.useCssTransitions));
</script>

<div
	class={classNames(
		'relative hover:scale-105',
		{
			'scale-105': hasFocus
			// 'transition-all': enabled
		},
		$$restProps.class
	)}
	style={enabled ? 'transition: transform 200ms;' : ''}
	{...$$restProps}
>
	<slot />
</div>

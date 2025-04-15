<script lang="ts">
	import classNames from 'classnames';
	import { localSettings } from '../stores/localstorage.store';
	import { inputMode } from '$lib/stores/input-mode.store';

	export let hasFocus: boolean;
	export let enabled = true;
	$: useTransitions = $localSettings.useCssTransitions;
</script>

<div>
	<div
		{...$$restProps}
		style={useTransitions ? 'transition: transform 200ms;' : ''}
		class={classNames(
			'relative',
			{
				'scale-105': hasFocus && $inputMode,
				'hover:scale-105': useTransitions && enabled
				// 'transition-all': enabled
			},
			$$restProps.class
		)}
	>
		<slot />
	</div>
</div>

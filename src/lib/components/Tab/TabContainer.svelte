<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';

	export let absolute = false;
</script>

<div class="w-full h-full flex flex-1">
	<Container
		class={classNames(
			'flex-1 overflow-hidden',
			{
				'relative *:absolute -mx-4 *:inset-x-4 *:inset-y-0': absolute
			},
			$$restProps.class
		)}
	>
		<slot />
	</Container>
</div>

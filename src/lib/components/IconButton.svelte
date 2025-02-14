<script lang="ts">
	import Container from './Container.svelte';
	import classNames from 'classnames';
</script>

<Container on:clickOrSelect let:hasFocus class="cursor-pointer group">
	<div
		class={classNames(
			'group-hover:bg-primary-500 group-hover:text-secondary-800 rounded-full p-3',
			{
				'bg-primary-500 text-secondary-800': hasFocus
			}
		)}
	>
		<slot />
	</div>
</Container>

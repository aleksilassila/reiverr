<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';

	export let disabled = false;
</script>

<Container let:hasFocus on:clickOrSelect {disabled} class="float-left" on:enter>
	<div
		class={classNames(
			'border-2 rounded-2xl p-1 cursor-pointer font-medium tracking-wide transition-colors',
			{
				'border-zinc-400': !hasFocus,
				'border-primary-500': hasFocus,
				'opacity-50': disabled
			}
		)}
	>
		<div
			class={classNames('h-10 w-10 rounded-xl flex items-center justify-center transition-colors', {
				'bg-primary-500 text-secondary-800': hasFocus,
				'bg-transparent': !hasFocus
			})}
		>
			<slot />
		</div>
	</div>
</Container>

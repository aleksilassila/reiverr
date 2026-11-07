<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from './Container.svelte';
	import classNames from 'classnames';
	import type { IconComponent } from '$lib/components/icon.type';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		icon: IconComponent;
		type?: 'primary' | 'primary-dark';
	}

	let { icon, type = 'primary', onClickOrSelect }: Props = $props();
</script>

<Container
	class={classNames(
		'selectable flex items-center justify-center h-11 w-11 rounded-lg cursor-pointer',
		{
			'bg-secondary-800': type === 'primary',
			'bg-primary-900': type === 'primary-dark'
		}
	)}
	{onClickOrSelect}
>
	{@const SvelteComponent = icon}
	<SvelteComponent size={19} />
</Container>

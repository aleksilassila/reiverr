<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import classNames from 'classnames';
	import Container from './Container.svelte';
	import AnimateScale from './AnimateScale.svelte';
	import type { IconComponent } from '$lib/components/icon.type';
	import IconOverlay from './IconOverlay.svelte';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		url: string;
		icon?: IconComponent | undefined;
		/** The icon that gets the focus when its container does */
		defaultFocus?: boolean;
		class?: string;
	}

	let {
		url,
		icon = undefined,
		defaultFocus = false,
		onClickOrSelect,
		class: className
	}: Props = $props();
	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		{selectable}
		class={classNames(
			'selectable w-40 h-40 rounded-xl overflow-hidden cursor-pointer relative',
			className
		)}
		{defaultFocus}
		{onClickOrSelect}
	>
		<div class="bg-center bg-cover w-full h-full" style={`background-image: url('${url}')`}></div>
		{#if icon}
			<IconOverlay {icon} />
		{/if}
	</Container>
</AnimateScale>

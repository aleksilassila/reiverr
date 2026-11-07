<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import AnimateScale from '../AnimateScale.svelte';
	import { navigate } from '../StackRouter/stack-router.store';

	type Props = Omit<ContainerProps, 'children'> & {
		onEnter?: ContainerProps['onEnter'];
		tmdbId: number;
		// export let type: TitleType = 'person';
		backdropUrl: string;
		name: string;
		subtitle: string;
		size?: 'dynamic' | 'md' | 'lg';
	};

	let { tmdbId, backdropUrl, name, subtitle, size = 'md', onEnter, ...rest }: Props = $props();

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		{...rest}
		class={classNames(
			'flex flex-col justify-start rounded-xl overflow-hidden relative shrink-0 selectable hover:text-inherit hover:bg-stone-800 focus-visible:bg-stone-800 bg-secondary-800 group text-left cursor-pointer',
			{
				'w-56 h-80': size === 'md',
				'h-52': size === 'lg',
				'w-full': size === 'dynamic'
			}
		)}
		onClickOrSelect={() => {
			if (tmdbId) navigate(`/person/${tmdbId}`);
		}}
		{onEnter}
		{selectable}
		focusOnClick
	>
		<!--		<div-->
		<!--			class="mx-auto rounded-full overflow-hidden flex-shrink-0 aspect-square w-full bg-zinc-200 bg-opacity-20"-->
		<!--		>-->
		<!--			<div-->
		<!--				style={"background-image: url('" + backdropUrl + "')"}-->
		<!--				class="bg-center bg-cover group-hover:scale-105 group-focus-visible:scale-105 transition-transform w-full h-full"-->
		<!--			/>-->
		<!--		</div>-->

		<div
			style={"background-image: url('" + backdropUrl + "')"}
			class="bg-center bg-cover w-full h-full"
			draggable="false"
		></div>
		<div class="p-4">
			<h2 class="text-sm text-zinc-300 font-medium line-clamp-1">{subtitle}</h2>
			<h1 class="font-semibold line-clamp-2">
				{name}
			</h1>
		</div>
	</Container>
</AnimateScale>

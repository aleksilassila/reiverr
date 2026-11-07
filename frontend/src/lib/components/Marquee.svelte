<script lang="ts">
	import classNames from 'classnames';
	import { onDestroy, type Snippet } from 'svelte';
	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();

	let parentWidth = $state(0);
	let childWidth = $state(0);
	let transformX = $state(0);
	let interval: ReturnType<typeof setInterval>;

	function animate(parent: number, child: number) {
		clearInterval(interval);
		transformX = 0;

		if (child && parent && child > parent) {
			const helper = () => {
				if (!transformX) {
					transformX = parent - child;
				} else {
					transformX = 0;
				}
			};
			interval = setTimeout(() => {
				helper();
				interval = setInterval(helper, 5000);
			}, 2000);
			// interval = setInterval(helper, 5000);
		}
	}

	onDestroy(() => clearInterval(interval));
	$effect(() => {
		animate(parentWidth, childWidth);
	});
</script>

<h1
	class={classNames('overflow-x-hidden flex items-center relative', className)}
	bind:clientWidth={parentWidth}
>
	<span
		class="text-nowrap whitespace-nowrap"
		style={`transform: translateX(${transformX}px); transition: transform 3s linear;`}
		bind:clientWidth={childWidth}
	>
		<span>
			{@render children?.()}
		</span>
	</span>
</h1>

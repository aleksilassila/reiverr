<script lang="ts">
	import classNames from 'classnames';
	import { onDestroy } from 'svelte';

	let parentWidth = 0;
	let childWidth = 0;
	let transformX = 0;
	let interval: ReturnType<typeof setInterval>;

	$: animate(parentWidth, childWidth);

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
</script>

<h1
	class={classNames('overflow-x-hidden flex items-center relative', $$restProps.class)}
	bind:clientWidth={parentWidth}
>
	<span
		class="text-nowrap whitespace-nowrap"
		style={`transform: translateX(${transformX}px); transition: transform 3s linear;`}
		bind:clientWidth={childWidth}
	>
		<span>
			<slot />
		</span>
	</span>
</h1>

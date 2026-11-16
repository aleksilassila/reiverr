<script lang="ts">
	interface Props {
		/** From 0 to 1 */
		value: number;
		onChange: (value: number) => void;
		step?: number;
	}

	let { value, onChange, step = 0.01 }: Props = $props();
</script>

<!-- In the text color of where it is placed -->
<div class="h-4 relative">
	<div class="absolute inset-y-1 inset-x-2 rounded-full bg-current opacity-30"></div>
	<div
		class="absolute inset-y-1 rounded-full bg-current"
		style={`left: 0.5rem; right: calc(${(1 - value) * 100}% - 0.5rem + ${value}rem);`}
	></div>
	<div
		class="absolute inset-y-0 w-4 h-4 bg-current rounded-full"
		style={`left: calc(${value * 100}% - ${value}rem);`}
	></div>

	<!-- Blurred after a drag, so that the arrow keys go to the focus navigation and not to the input -->
	<input
		type="range"
		class="w-full absolute cursor-pointer h-4 inset-y-0 opacity-0"
		min={0}
		max={1}
		{step}
		{value}
		oninput={(e) => onChange(e.currentTarget.valueAsNumber)}
		onpointerup={(e) => e.currentTarget.blur()}
	/>
</div>

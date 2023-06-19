<script lang="ts">
	export let index = 0;
</script>

<div
	class="h-40 w-72 rounded overflow-hidden drop-shadow-2xl bg-darken animate-pulse"
	style={'animation-delay: ' + ((index * 100) % 2000) + 'ms;'}
/>

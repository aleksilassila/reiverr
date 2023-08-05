<script lang="ts">
	export let progress = 0;
</script>

<div class="h-1 bg-zinc-200 bg-opacity-20 rounded-full overflow-hidden">
	<div style={'width: ' + progress + '%'} class="h-full bg-zinc-200 bg-opacity-80" />
</div>

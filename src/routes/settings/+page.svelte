<script>
	import { version } from '$app/environment';
	import { _ } from 'svelte-i18n';
</script>

<div class="h-screen flex flex-col items-center justify-center text-zinc-500">
	<div class="flex-1 flex items-center justify-center max-w-xl text-center m-8">
		{$_('settingsEmpty')}
	</div>
	<div class="flex items-center p-8 gap-8">
		<a href="https://github.com/aleksilassila/reiverr">GitHub</a>
		<div>v{version}</div>
	</div>
</div>

<!-- Language settings -->

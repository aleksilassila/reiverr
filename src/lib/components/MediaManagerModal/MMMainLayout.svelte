<script>
	import Container from '../../../Container.svelte';
</script>

<div class="flex flex-col">
	<div class="mb-16">
		<div class="text-4xl font-semibold">
			<slot name="title" />
		</div>
		<div class="text-zinc-300 font-medium text-lg mt-2">
			<slot name="subtitle" />
		</div>
	</div>
	<Container direction="horizontal" class="grid grid-cols-2 gap-16">
		<div class="flex flex-col">
			<h1 class="text-2xl font-semibold mb-4">Releases</h1>
			<slot name="releases" />
		</div>
		<div class="flex flex-col">
			<div class="flex flex-col mb-8">
				<h1 class="text-2xl font-semibold mb-4">Local Files</h1>
				<slot name="local-files" />
			</div>

			<div class="flex flex-col mb-8">
				<h1 class="text-2xl font-semibold mb-4">Downloads</h1>
				<slot name="downloads" />
			</div>
		</div>
	</Container>
</div>

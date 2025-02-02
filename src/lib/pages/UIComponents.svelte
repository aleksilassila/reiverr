<script>
	import Container from '$components/Container.svelte';
	import Button from '../components/Button.svelte';
</script>

<div class="flex flex-col items-start m-16">
	<h1 class="font-semibold text-2xl text-secondary-100 mb-4">UI Components</h1>
	<Container direction="horizontal" class="flex gap-8">
		<Button>Button</Button>
		<Button>Button2</Button>
	</Container>
</div>

<script lang="ts">
	export let src: string;
	export let kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
	export let srclang: string;
</script>

<track {src} {kind} {srclang} />

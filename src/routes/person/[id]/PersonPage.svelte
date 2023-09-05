<script lang="ts">
	import { getTmdbPerson } from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import PersonPageLayout from '$lib/components/PersonPageLayout/PersonPageLayout.svelte';
	import FacebookIcon from '$lib/components/svgs/FacebookIcon.svelte';
	import ImdbIcon from '$lib/components/svgs/ImdbIcon.svelte';
	import TwitterIcon from '$lib/components/svgs/TwitterIcon.svelte';
	import YoutubeIcon from '$lib/components/svgs/YoutubeIcon.svelte';
	import { DotFilled, InstagramLogo } from 'radix-icons-svelte';

	const GenderDescription = ['Not set', 'Female', 'Male', 'Non-binary'];

	export let personId: number;
	export let isModal = false;
	export let handleCloseModal: () => void = () => {};

	const tmdbUrl = 'https://www.themoviedb.org/person/' + personId;
	const data = loadInitialPageData();

	async function loadInitialPageData() {
		const tmdbPerson = await getTmdbPerson(personId);
		const tmdbMoviesOn = await Promise.all(
			tmdbPerson?.movie_credits.cast?.map(fetchCardTmdbProps) ?? []
		)
			.then((res) => res.filter((p) => p.backdropUrl))
			.then((res) => res.sort((a, b) => b.rating - a.rating));
		const tmdbSeriesOn = await Promise.all(
			tmdbPerson?.tv_credits.cast?.map(fetchCardTmdbProps) ?? []
		)
			.then((res) => res.filter((p) => p.backdropUrl))
			.then((res) => res.sort((a, b) => b.rating - a.rating));

		const tmdbSocials = [];

		for (const [social, id] of Object.entries(tmdbPerson.external_ids)) {
			if (Boolean(id)) {
				switch (social) {
					case 'facebook_id':
						tmdbSocials.push({
							url: `https://facebook.com/${id}`,
							icon: FacebookIcon
						});
						break;
					case 'imdb_id':
						tmdbSocials.push({
							url: `https://imdb.com/name/${id}`,
							icon: ImdbIcon
						});
						break;
					case 'twitter_id':
						tmdbSocials.push({
							url: `https://x.com/${id}`,
							icon: TwitterIcon
						});
						break;
					case 'youtube_id':
						tmdbSocials.push({
							url: `https://youtube.com/@${id}`,
							icon: YoutubeIcon
						});
						break;
					case 'instagram_id':
						tmdbSocials.push({
							url: `https://instagram.com/${id}`,
							icon: InstagramLogo
						});
						break;
				}
			}
		}

		return {
			tmdbPerson,
			tmdbMoviesOn,
			tmdbSeriesOn,
			tmdbSocials: tmdbSocials.slice(0, 6),
		};
	}
</script>

{#await data}
	<PersonPageLayout {isModal} {handleCloseModal} />
{:then { tmdbPerson, tmdbMoviesOn, tmdbSeriesOn, tmdbSocials }}
	{@const person = tmdbPerson}
	<PersonPageLayout
		titleInformation={{
			tmdbId: Number(person?.id),
			type: 'person',
			title: person?.name || 'Person',
			backdropUriCandidates: [person?.profile_path ?? ''],
			posterPath: person?.profile_path || '',
			tagline: person?.known_for_department || person?.name || '',
			overview: person?.biography || ''
		}}
		{isModal}
		{handleCloseModal}
	>
		<svelte:fragment slot="title-info">
			{#if person?.homepage}
				<p>{person?.homepage}</p>
				<DotFilled />
			{/if}
			<a href={tmdbUrl} target="_blank">Popularity: {person?.popularity?.toFixed(1)} on TMDB</a>
		</svelte:fragment>
		<svelte:fragment slot="title-right" />

		<svelte:fragment slot="info-components">
			{#if tmdbSocials}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Socials</p>
					<h2 class="pt-2 text-sm">
						<div class="flex gap-2 justify-start">
							{#each tmdbSocials ?? [] as Prop}
								<a href={Prop.url} target="_blank" >
									<Prop.icon class="h-6 w-6 flex-shrink-0 text-white"/>
								</a>
							{/each}
						</div>
					</h2>
				</div>
			{/if}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Known for</p>
				<h2 class="font-medium">
					{person?.known_for_department}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Gender</p>
				<h2 class="font-medium">
					{GenderDescription[person?.gender ?? 0]}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Birthday</p>
				<h2 class="font-medium">
					{new Date(person?.birthday || Date.now()).toLocaleDateString('en', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Place of Birth</p>
				<h2 class="font-medium">
					{person?.place_of_birth}
				</h2>
			</div>
			{#if person?.also_known_as}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Also known as</p>
					<h2 class="font-medium">
						{#each person?.also_known_as ?? [] as prop}
							<p>{prop}</p>
						{/each}
					</h2>
				</div>
			{/if}
		</svelte:fragment>

		<div slot="movie-carousel-title" class="font-medium text-lg">Appeared on movies like</div>
		<svelte:fragment slot="movie-carousel">
			{#await tmdbMoviesOn}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} openInModal={isModal} />
				{/each}
			{/await}
		</svelte:fragment>
		<div slot="tv-carousel-title" class="font-medium text-lg">And tv shows like</div>
		<svelte:fragment slot="tv-carousel">
			{#await tmdbSeriesOn}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} openInModal={isModal} />
				{/each}
			{/await}
		</svelte:fragment>
	</PersonPageLayout>
{/await}

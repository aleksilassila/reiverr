<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import SelectDialog from '$lib/components/Dialog/SelectDialog.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import IconToggle from '$lib/components/IconToggle.svelte';
	import Marquee from '$lib/components/Marquee.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import {
		createErrorNotification,
		createInfoNotification
	} from '$lib/components/Notifications/notification.store';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import SelectButtonGroup from '$lib/components/SelectButtonGroup.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import SelectItem from '$lib/components/SelectItem.svelte';
	import { useTabs } from '$lib/components/Tab/Tab';
	import Tab from '$lib/components/Tab/Tab.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import TabItem from '$lib/components/Tab/TabItem.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { ArrowRight, Bookmark, ChevronDown, Heart, Plus, Trash } from 'radix-icons-svelte';
	import RequestRow from '../TitlePages/SeriesPage/RequestRow.svelte';
	import ColorSwatch from './ColorSwatch.svelte';
	import UiSheet from './UiSheet.svelte';

	// The classes are written out in full, since Tailwind only generates the ones it finds
	const COLORS = [
		{
			name: 'primary',
			swatches: [
				{ label: '50', background: 'bg-primary-50' },
				{ label: '100', background: 'bg-primary-100' },
				{ label: '200', background: 'bg-primary-200' },
				{ label: '300', background: 'bg-primary-300' },
				{ label: '400', background: 'bg-primary-400' },
				{ label: '500', background: 'bg-primary-500' },
				{ label: '600', background: 'bg-primary-600' },
				{ label: '700', background: 'bg-primary-700' },
				{ label: '800', background: 'bg-primary-800' },
				{ label: '900', background: 'bg-primary-900' },
				{ label: '950', background: 'bg-primary-950' }
			]
		},
		{
			name: 'secondary',
			swatches: [
				{ label: '50', background: 'bg-secondary-50' },
				{ label: '100', background: 'bg-secondary-100' },
				{ label: '200', background: 'bg-secondary-200' },
				{ label: '300', background: 'bg-secondary-300' },
				{ label: '400', background: 'bg-secondary-400' },
				{ label: '500', background: 'bg-secondary-500' },
				{ label: '600', background: 'bg-secondary-600' },
				{ label: '700', background: 'bg-secondary-700' },
				{ label: '800', background: 'bg-secondary-800' },
				{ label: '900', background: 'bg-secondary-900' },
				{ label: '950', background: 'bg-secondary-950' }
			]
		},
		{
			name: 'other',
			swatches: [
				{ label: 'darken', background: 'bg-darken' },
				{ label: 'lighten', background: 'bg-lighten' },
				{ label: 'highlight-foreground', background: 'bg-highlight-foreground' },
				{ label: 'highlight-background', background: 'bg-highlight-background' }
			]
		}
	];

	const SELECT_OPTIONS = [
		{ label: 'First', value: 'first' },
		{ label: 'Second', value: 'second' },
		{ label: 'Third', value: 'third' }
	];

	const CARDS = [
		{ title: 'Card', progress: 0 },
		{ title: 'In progress', progress: 0.3 },
		{ title: 'Almost done', progress: 0.8 },
		{ title: 'Fourth', progress: 0 },
		{ title: 'Fifth', progress: 0 },
		{ title: 'Sixth', progress: 0 },
		{ title: 'Seventh', progress: 0 },
		{ title: 'Eighth', progress: 0 }
	];

	const BACKDROPS = [
		'https://image.tmdb.org/t/p/w300/mU7l9UaEItxHbg2YBNs0sHjoFVY.jpg',
		'https://image.tmdb.org/t/p/w780/4NBYDOnEjAzyuP7CMkD5s7fs44K.jpg',
		'https://image.tmdb.org/t/p/w300/nNt41AqlnyLMgtiyfiVuS2O8ES9.jpg',
		'https://image.tmdb.org/t/p/w300/enVrO8TRkdT8dmYXTfI4sEjR5Kp.jpg',
		'https://image.tmdb.org/t/p/w300/1xfNJ0DE8MrLagLWHc3fYGfdgTU.jpg'
	];

	const { registrar: registerScroll, topVisible } = setScrollContext();
	const scroll = scrollIntoView({ vertical: 128 });
	const wait = () => new Promise((resolve) => setTimeout(resolve, 1500));

	const tab = useTabs(0);
	let selected = 'first';
	let selectedItem: string | undefined = undefined;
	let toggled = true;
	let checked = false;
	let text = '';
	let backdrop = 0;
	let rows = [
		{
			title: 'S1E1 - On disk',
			subtitle: 'Some.Show.S01.1080p.WEB-DL.x264-GROUP',
			status: 'On disk',
			checked: true
		},
		{
			title: 'S1E2 - Downloading',
			subtitle: 'Some.Show.S01.1080p.WEB-DL.x264-GROUP',
			status: 'Downloading 42%',
			checked: true
		},
		{
			title: 'S1E3 - Failed',
			subtitle: 'Some.Show.S01E03.1080p.WEB-DL.x264-GROUP',
			status: 'No file of the episode in the torrent',
			isError: true,
			checked: true
		},
		{
			title: 'S1E4 - Not requested',
			subtitle: 'Some.Show.S01.1080p.WEB-DL.x264-GROUP',
			subtitleDimmed: true,
			status: '',
			checked: false
		}
	];

	$: allChecked = rows.every((row) => row.checked);

	function openSelectDialog() {
		createModal(SelectDialog, {
			title: 'Select dialog',
			subtitle: 'Pick an option. It is shown in the select fields and groups.',
			options: SELECT_OPTIONS.map((option) => option.label),
			selectedOption: SELECT_OPTIONS.find((option) => option.value === selected)?.label,
			handleSelectOption: (label: string) =>
				(selected = SELECT_OPTIONS.find((option) => option.label === label)?.value ?? selected)
		});
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h1 class="h2">UI</h1>
	<p class="text-secondary-300 font-medium">
		The colors of tailwind.config.js and the components of the app.
	</p>
</FloatingHeader>

<Container
	focusOnMount
	class="h-screen overflow-y-auto overflow-x-hidden scrollbar-hide pt-16 pb-32 px-32 space-y-16"
	style="backface-visibility: hidden"
>
	<div class="border-b-2 border-secondary-700 pb-4 space-y-2" use:registerScroll>
		<h1 class="h1">UI</h1>
		<p class="body">The colors of tailwind.config.js and the components of the app.</p>
	</div>

	<section class="space-y-8">
		<h2 class="h2">Colors</h2>
		{#each COLORS as family (family.name)}
			<div>
				<h3 class="h4 mb-4">{family.name}</h3>
				<Container direction="horizontal" class="flex space-x-2" on:enter={scroll}>
					{#each family.swatches as swatch (swatch.background)}
						<ColorSwatch {...swatch} />
					{/each}
				</Container>
			</div>
		{/each}
	</section>

	<section class="space-y-4">
		<h2 class="h2">Typography</h2>
		<div class="h1">h1 The quick brown fox</div>
		<div class="h2">h2 The quick brown fox</div>
		<div class="h3">h3 The quick brown fox</div>
		<div class="h4">h4 The quick brown fox</div>
		<div class="h5">h5 The quick brown fox</div>
		<div class="body">body The quick brown fox jumps over the lazy dog.</div>
		<div class="h-ghost">h-ghost Nothing here yet</div>
		<div class="error">error Could not load the thing</div>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Buttons</h2>
		<Container direction="horizontal" class="flex items-center space-x-4" on:enter={scroll}>
			<Button>Primary</Button>
			<Button type="secondary">Secondary</Button>
			<Button type="primary-dark">Primary dark</Button>
			<Button disabled>Disabled</Button>
			<Button icon={Plus}>Icon</Button>
			<Button iconAfter={ArrowRight}>Icon after</Button>
		</Container>
		<Container direction="horizontal" class="flex items-center space-x-4" on:enter={scroll}>
			<Button action={wait}>Async action</Button>
			<Button
				confirmDanger
				icon={Trash}
				on:clickOrSelect={() => createInfoNotification('Confirmed', 'Selected twice')}
			>
				Confirm danger
			</Button>
			<Button secondaryAction={() => createInfoNotification('Secondary action')}>
				Secondary action
			</Button>
			<IconButton on:clickOrSelect={() => createInfoNotification('Icon button')}>
				<Heart size={24} />
			</IconButton>
			<IconToggle icon={Bookmark} on:clickOrSelect={() => createInfoNotification('Icon toggle')} />
			<PlayButton on:click={() => createInfoNotification('Play button', 'Mouse only')} />
		</Container>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Fields</h2>
		<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
			<SelectField
				class="flex-1"
				value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
				on:clickOrSelect={openSelectDialog}
			>
				Select field
				<ChevronDown slot="icon" let:size let:iconClass {size} class={iconClass} />
			</SelectField>
			<SelectField
				class="flex-1"
				type="primary"
				value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
				on:clickOrSelect={openSelectDialog}
			>
				Select field, primary
			</SelectField>
			<SelectField
				class="flex-1"
				type="transparent"
				value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
				on:clickOrSelect={openSelectDialog}
			>
				Select field, transparent
				<ChevronDown slot="icon" let:size let:iconClass {size} class={iconClass} />
			</SelectField>
			<SelectField class="flex-1" value="Disabled" disabled>Select field, disabled</SelectField>
		</Container>
		<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
			<TextField
				class="flex-1"
				value={text}
				placeholder="Type something"
				on:change={({ detail }) => (text = detail)}
			>
				Text field
			</TextField>
			<TextField class="flex-1" value="Valid" isValid={true}>Valid</TextField>
			<TextField class="flex-1" value="Invalid" isValid={false} type="password">
				Invalid, password
			</TextField>
		</Container>
		<Container direction="horizontal" class="flex space-x-8" on:enter={scroll}>
			<Container class="flex-1">
				<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
					<span class="mr-2">Toggle</span>
					<Toggle checked={toggled} on:change={({ detail }) => (toggled = detail)} />
				</div>
				<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
					<span class="mr-2">Checkbox</span>
					<Checkbox {checked} on:change={({ detail }) => (checked = detail)} />
				</div>
				<Toggle
					label="Toggle with its own label"
					checked={!toggled}
					on:change={({ detail }) => (toggled = !detail)}
				/>
			</Container>
			<div class="flex-1">
				<SelectButtonGroup
					name="Select button group"
					options={SELECT_OPTIONS}
					{selected}
					on:select={({ detail }) => (selected = detail)}
				/>
			</div>
			<div class="flex-1">
				<SelectButtonGroup
					name="Primary style"
					style="primary"
					options={[...SELECT_OPTIONS, { label: 'Disabled', value: 'disabled', disabled: true }]}
					{selected}
					on:select={({ detail }) => (selected = detail)}
				/>
			</div>
			<Container class="flex-1 space-y-4">
				<h3 class="font-semibold text-sm text-secondary-400">Select items</h3>
				{#each SELECT_OPTIONS as option (option.value)}
					<SelectItem
						selected={selectedItem === option.value}
						on:clickOrSelect={() => (selectedItem = option.value)}
					>
						{option.label}
					</SelectItem>
				{/each}
			</Container>
		</Container>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Tabs</h2>
		<Container
			direction="horizontal"
			class="flex space-x-8"
			on:enter={scroll}
			on:blur={({ detail: selectable }) => selectable.activateChild($tab)}
		>
			<TabItem selected={$tab === 0} on:select={() => tab.set(0)}>First tab</TabItem>
			<TabItem selected={$tab === 1} on:select={() => tab.set(1)}>Second tab</TabItem>
			<TabItem disabled>Disabled tab</TabItem>
		</Container>
		<TabContainer>
			<Tab {...tab} tab={0}>
				<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
					<Button>Button of the first tab</Button>
				</Container>
			</Tab>
			<Tab {...tab} tab={1}>
				<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
					<Button>Button of the second tab</Button>
					<Button type="secondary">Another one</Button>
				</Container>
			</Tab>
		</TabContainer>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Request rows</h2>
		<Container class="space-y-2">
			<RequestRow
				heading
				title="Season 1 (4 episodes)"
				subtitle="Season pack: Some.Show.S01.1080p.WEB-DL.x264-GROUP"
				status="12 peers, 3.4 MB/s"
				checked={allChecked}
				partiallyChecked={rows.some((row) => row.checked)}
				on:toggle={() => (rows = rows.map((row) => ({ ...row, checked: !allChecked })))}
				on:open={() => createInfoNotification('Open', 'Season 1')}
				on:enter={scroll}
			/>
			{#each rows as row (row.title)}
				<RequestRow
					{...row}
					on:toggle={() =>
						(rows = rows.map((r) => (r === row ? { ...r, checked: !r.checked } : r)))}
					on:open={() => createInfoNotification('Open', row.title)}
					on:enter={scroll}
				/>
			{/each}
		</Container>
	</section>

	<section>
		<div class="-mx-32">
			<Carousel header="Cards" scrollClass="px-32" on:enter={scroll}>
				{#each CARDS as card (card.title)}
					<Card
						title={card.title}
						progress={card.progress}
						on:enter={scrollIntoView({ horizontal: 128 })}
						on:clickOrSelect={() => createInfoNotification(card.title)}
					/>
				{/each}
				<Card
					title="Portrait"
					orientation="portrait"
					on:enter={scrollIntoView({ horizontal: 128 })}
				/>
				<CardPlaceholder index={0} />
				<CardPlaceholder index={1} orientation="portrait" />
			</Carousel>
		</div>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Dialogs, sheets and notifications</h2>
		<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
			<Button
				on:clickOrSelect={() =>
					createModal(ConfirmDialog, {
						header: 'Confirm dialog',
						body: 'Confirm resolves after a moment and closes the dialog.',
						confirm: wait
					})}
			>
				Confirm dialog
			</Button>
			<Button on:clickOrSelect={openSelectDialog}>Select dialog</Button>
			<Button on:clickOrSelect={() => createModal(UiSheet, {})}>Sheet</Button>
			<Button
				on:clickOrSelect={() =>
					createInfoNotification('Info notification', 'Goes away in a few seconds.')}
			>
				Info notification
			</Button>
			<Button
				on:clickOrSelect={() =>
					createErrorNotification('Error notification', 'Something went wrong.')}
			>
				Error notification
			</Button>
		</Container>
	</section>

	<section class="space-y-8">
		<h2 class="h2">Progress and marquee</h2>
		<div class="space-y-4 max-w-md">
			<ProgressBar progress={0.3} />
			<ProgressBar progress={0.75} />
			<Marquee class="h3 w-64">A title that is too long to fit and scrolls back and forth</Marquee>
		</div>
	</section>

	<!-- The background of the request page: a blurred, darkened backdrop under a primary-900/50 overlay -->
	<section class="relative -mx-32 overflow-hidden">
		<div class="absolute inset-0 scale-110">
			<div
				class="absolute inset-0 bg-secondary-900 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
				style={`background-image: url('${BACKDROPS[backdrop]}');`}
			/>
		</div>
		<div class="relative bg-primary-900/50 px-32 py-16 space-y-8">
			<h2 class="h2">On the request page background</h2>
			<Container
				direction="horizontal"
				class="flex space-x-8"
				on:enter={scroll}
				on:blur={({ detail: selectable }) => selectable.activateChild(backdrop)}
			>
				{#each BACKDROPS as url, index (url)}
					<TabItem selected={backdrop === index} on:select={() => (backdrop = index)}>
						Backdrop {index + 1}
					</TabItem>
				{/each}
			</Container>
			<Container direction="horizontal" class="flex space-x-4" on:enter={scroll}>
				<SelectField
					class="flex-1"
					value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
					on:clickOrSelect={openSelectDialog}
				>
					Select field
					<ChevronDown slot="icon" let:size let:iconClass {size} class={iconClass} />
				</SelectField>
				<SelectField
					class="flex-1"
					type="primary"
					value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
					on:clickOrSelect={openSelectDialog}
				>
					Select field, primary
					<ChevronDown slot="icon" let:size let:iconClass {size} class={iconClass} />
				</SelectField>
				<SelectField
					class="flex-1"
					type="transparent"
					value={SELECT_OPTIONS.find((option) => option.value === selected)?.label ?? ''}
					on:clickOrSelect={openSelectDialog}
				>
					Select field, transparent
					<ChevronDown slot="icon" let:size let:iconClass {size} class={iconClass} />
				</SelectField>
				<TextField
					class="flex-1"
					value={text}
					placeholder="Type something"
					on:change={({ detail }) => (text = detail)}
				>
					Text field
				</TextField>
			</Container>
			<div class="h-px w-full bg-secondary-700" />
			<Container direction="horizontal" class="flex items-center space-x-4" on:enter={scroll}>
				<Button>Primary</Button>
				<Button type="secondary">Secondary</Button>
				<Button type="primary-dark">Primary dark</Button>
				<Button disabled>Disabled</Button>
				<IconButton on:clickOrSelect={() => createInfoNotification('Icon button')}>
					<Heart size={24} />
				</IconButton>
				<IconToggle
					icon={Bookmark}
					on:clickOrSelect={() => createInfoNotification('Icon toggle')}
				/>
			</Container>
			<Container direction="horizontal" class="flex space-x-8" on:enter={scroll}>
				<div class="flex-1">
					<SelectButtonGroup
						name="Select button group"
						options={SELECT_OPTIONS}
						{selected}
						on:select={({ detail }) => (selected = detail)}
					/>
				</div>
				<div class="flex-1">
					<SelectButtonGroup
						name="Primary style"
						style="primary"
						options={SELECT_OPTIONS}
						{selected}
						on:select={({ detail }) => (selected = detail)}
					/>
				</div>
				<Container class="flex-1 space-y-4">
					<h3 class="font-semibold text-sm text-secondary-400">Select items</h3>
					{#each SELECT_OPTIONS as option (option.value)}
						<SelectItem
							selected={selectedItem === option.value}
							on:clickOrSelect={() => (selectedItem = option.value)}
						>
							{option.label}
						</SelectItem>
					{/each}
				</Container>
			</Container>
			<Container class="space-y-4">
				<RequestRow
					heading
					title="Season 1 (4 episodes)"
					subtitle="Season pack: Some.Show.S01.1080p.WEB-DL.x264-GROUP"
					status="12 peers, 3.4 MB/s"
					checked={allChecked}
					partiallyChecked={rows.some((row) => row.checked)}
					on:toggle={() => (rows = rows.map((row) => ({ ...row, checked: !allChecked })))}
					on:open={() => createInfoNotification('Open', 'Season 1')}
					on:enter={scroll}
				/>
				{#each rows as row (row.title)}
					<RequestRow
						{...row}
						on:toggle={() =>
							(rows = rows.map((r) => (r === row ? { ...r, checked: !r.checked } : r)))}
						on:open={() => createInfoNotification('Open', row.title)}
						on:enter={scroll}
					/>
				{/each}
			</Container>
		</div>
	</section>
</Container>

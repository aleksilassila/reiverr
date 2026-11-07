<script lang="ts">
	import { EyeClosed, EyeOpen, Trash, Upload } from 'radix-icons-svelte';
	import { get } from 'svelte/store';
	import { type ReiverrUser } from '../../apis/reiverr/reiverr-api';
	import { getRandomProfilePicture, profilePictures } from '../../profile-pictures';
	import { createUser, deleteUser, updateUser } from '../../queries/users.queries';
	import { sessions } from '../../stores/session.store';
	import { user as userStore } from '../../stores/user.store';
	import { GIGABYTE } from '../../utils';
	import Button from '../Button/Button.svelte';
	import Container from '../Container.svelte';
	import IconToggle from '../IconToggle.svelte';
	import ProfileIcon from '../ProfileIcon.svelte';
	import SelectField from '../SelectField.svelte';
	import { navigate, useComponentStack } from '../StackRouter/stack-router.store';
	import { useTabs } from '../Tab/Tab';
	import Tab from '../Tab/Tab.svelte';
	import TextField from '../TextField.svelte';
	import Toggle from '../Toggle.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import Dialog from './Dialog.svelte';
	import type { AxiosError } from 'axios';
	import TabContainer from '../Tab/TabContainer.svelte';

	const Tabs = { EditProfile: 0, ProfilePictures: 1 } as const;

	const { close, push } = useComponentStack();

	interface Props {
		user?: ReiverrUser | undefined;
		createNew?: boolean;
		admin?: boolean;
	}

	let { user = undefined, createNew = false, admin = createNew }: Props = $props();

	const tab = useTabs(Tabs.EditProfile, { remount: false });

	const gigabytesOf = (bytes: number | null | undefined) =>
		bytes === null || bytes === undefined ? '' : String(bytes / GIGABYTE);

	let name = $state(user?.name || '');
	let quota = $state(gigabytesOf(user?.quotaBytes));
	let oldPassword = $state('');
	let oldPasswordVisible = $state(false);
	let newPassword = $state('');
	let newPasswordVisible = $state(false);
	let isAdmin = $state(user?.isAdmin || false);
	let profilePictureFiles: FileList | undefined = $state();
	let profilePictureBase64: string = $state(
		user?.profilePicture ?? getRandomProfilePicture() ?? ''
	);
	let profilePictureTitle: string | undefined = $state();
	let profilePictureFilesInput: HTMLInputElement | undefined = $state();

	let errorMessage = $state('');

	const messageOf = (e: AxiosError<any>): string =>
		e.response?.data?.message ?? e.message ?? String(e);

	function setProfilePicture(image: string) {
		profilePictureBase64 = image;
		tab.set(Tabs.EditProfile);
	}

	async function save() {
		const id = user?.id;

		if (!id) return;

		const quotaBytes = quota === '' ? null : Math.round(Number(quota) * GIGABYTE);
		const error = await updateUser(id, {
			name,
			password: newPassword,
			oldPassword,
			profilePicture: profilePictureBase64,
			isAdmin,
			quotaBytes
		})
			.then(() => undefined)
			.catch(messageOf);

		if (error) {
			errorMessage = error;
		} else {
			close();
		}
	}

	async function create() {
		const error = await createUser({
			name,
			password: newPassword,
			isAdmin,
			profilePicture: profilePictureBase64
		})
			.then(() => undefined)
			.catch(messageOf);

		if (error) {
			errorMessage = error;
		} else {
			close();
		}
	}

	async function handleDeleteAccount() {
		const self = user?.id === get(userStore)?.id;
		if (!user?.id) return;
		const error = await deleteUser(user.id)
			.then(() => undefined)
			.catch(messageOf);
		if (error) {
			errorMessage = error;
		} else {
			close();
			if (self) {
				sessions.removeSession();
				navigate('/');
			}
		}
	}
	$effect(() => {
		const file = profilePictureFiles?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = () => setProfilePicture(reader.result as string);
			reader.readAsDataURL(file);
		}
	});
	$effect(() => {
		switch (profilePictureBase64) {
			case profilePictures.ana:
				profilePictureTitle = 'Ana';
				break;
			case profilePictures.emma:
				profilePictureTitle = 'Emma';
				break;
			case profilePictures.glen:
				profilePictureTitle = 'Glen';
				break;
			case profilePictures.henry:
				profilePictureTitle = 'Henry';
				break;
			case profilePictures.keanu:
				profilePictureTitle = 'Keanu';
				break;
			case profilePictures.leo:
				profilePictureTitle = 'Leo';
				break;
			case profilePictures.sydney:
				profilePictureTitle = 'Sydney';
				break;
			case profilePictures.zendaya:
				profilePictureTitle = 'Zendaya';
				break;
			default:
				profilePictureTitle = 'Custom';
				break;
		}
	});
	// Admins set the passwords of other users without the old ones
	let oldPasswordNeeded = $derived(!createNew && user?.id === $userStore?.id);
	let stale = $derived(
		(name !== user?.name && name !== '') ||
			oldPassword !== newPassword ||
			profilePictureBase64 !== user?.profilePicture ||
			isAdmin !== user?.isAdmin ||
			quota !== gigabytesOf(user?.quotaBytes)
	);
	let complete = $derived(name !== '');
</script>

<Dialog size="dynamic">
	<TabContainer class="grid -m-4 p-4 *:col-start-1 *:row-start-1 *:-my-4 *:py-4">
		<Tab {...tab.props} tab={Tabs.EditProfile} class="space-y-4 max-w-lg">
			<h1 class="h3">
				{createNew ? 'Create Account' : 'Edit Profile'}
			</h1>
			<TextField variant="primary-dark" bind:value={name}>name</TextField>
			<SelectField
				type="primary-dark"
				value={profilePictureTitle}
				onClickOrSelect={() => tab.set(Tabs.ProfilePictures)}
			>
				Profile Picture
			</SelectField>
			{#if oldPasswordNeeded}
				<Container direction="horizontal" class="flex space-x-4 items-end">
					<TextField
						variant="primary-dark"
						class="flex-1"
						bind:value={oldPassword}
						type={oldPasswordVisible ? 'text' : 'password'}
					>
						Old Password
					</TextField>
					<IconToggle
						type="primary-dark"
						onClickOrSelect={() => (oldPasswordVisible = !oldPasswordVisible)}
						icon={oldPasswordVisible ? EyeOpen : EyeClosed}
					/>
				</Container>
			{/if}
			<Container direction="horizontal" class="flex space-x-4 items-end">
				<TextField
					variant="primary-dark"
					class="flex-1"
					bind:value={newPassword}
					type={newPasswordVisible ? 'text' : 'password'}
				>
					New Password
				</TextField>
				<IconToggle
					type="primary-dark"
					onClickOrSelect={() => (newPasswordVisible = !newPasswordVisible)}
					icon={newPasswordVisible ? EyeOpen : EyeClosed}
				/>
			</Container>
			{#if isAdmin || admin}
				<div class="flex justify-between">
					<label>Admin</label>
					<Toggle bind:checked={isAdmin}>Admin</Toggle>
				</div>
			{/if}
			{#if $userStore?.isAdmin && !createNew}
				<TextField variant="primary-dark" type="number" bind:value={quota} placeholder="No quota">
					Storage quota in GB (empty for no quota)
				</TextField>
			{/if}
			{#if errorMessage}
				<div class="text-red-500 mb-4">{errorMessage}</div>
			{/if}
			<Container direction="horizontal" class="flex space-x-4 pt-4 *:flex-1">
				{#if !createNew}
					<Button type="primary-dark" disabled={!stale} action={save}>Save</Button>
					<Button
						type="primary-dark"
						icon={Trash}
						onClickOrSelect={() =>
							push({
								component: ConfirmDialog,
								props: {
									header: 'Delete Account',
									body: 'Are you sure you want to delete your account?',
									confirm: handleDeleteAccount
								}
							})}
					>
						Delete Account
					</Button>
				{:else}
					<Button type="primary-dark" disabled={!complete} action={create}>Create</Button>
				{/if}
			</Container>
		</Tab>

		<Tab
			{...tab.props}
			tab={Tabs.ProfilePictures}
			onBack={(e) => {
				tab.set(Tabs.EditProfile);
				e.stopPropagation();
			}}
		>
			<h1 class="h3 mb-6">Select Profile Picture</h1>
			<Container direction="grid" gridCols={3} class="grid grid-cols-3 gap-4 w-max">
				<ProfileIcon
					url={profilePictures.ana}
					onClickOrSelect={() => setProfilePicture(profilePictures.ana)}
					focusedChild={profilePictureBase64 === profilePictures.ana}
				/>
				<ProfileIcon
					url={profilePictures.emma}
					onClickOrSelect={() => setProfilePicture(profilePictures.emma)}
					focusedChild={profilePictureBase64 === profilePictures.emma}
				/>
				<ProfileIcon
					url={profilePictures.glen}
					onClickOrSelect={() => setProfilePicture(profilePictures.glen)}
					focusedChild={profilePictureBase64 === profilePictures.glen}
				/>
				<ProfileIcon
					url={profilePictures.henry}
					onClickOrSelect={() => setProfilePicture(profilePictures.henry)}
					focusedChild={profilePictureBase64 === profilePictures.henry}
				/>
				<ProfileIcon
					url={profilePictures.keanu}
					onClickOrSelect={() => setProfilePicture(profilePictures.keanu)}
					focusedChild={profilePictureBase64 === profilePictures.keanu}
				/>
				<ProfileIcon
					url={profilePictures.leo}
					onClickOrSelect={() => setProfilePicture(profilePictures.leo)}
					focusedChild={profilePictureBase64 === profilePictures.leo}
				/>
				<ProfileIcon
					url={profilePictures.sydney}
					onClickOrSelect={() => setProfilePicture(profilePictures.sydney)}
					focusedChild={profilePictureBase64 === profilePictures.sydney}
				/>
				<ProfileIcon
					url={profilePictures.zendaya}
					onClickOrSelect={() => setProfilePicture(profilePictures.zendaya)}
					focusedChild={profilePictureBase64 === profilePictures.zendaya}
				/>
				<ProfileIcon
					url="profile-pictures/leo.webp"
					onClickOrSelect={() => profilePictureFilesInput?.click()}
					icon={Upload}
				/>
				<input
					bind:this={profilePictureFilesInput}
					type="file"
					bind:files={profilePictureFiles}
					accept="image/png, image/jpeg"
					class="hidden"
				/>
			</Container>
		</Tab>
	</TabContainer>
</Dialog>

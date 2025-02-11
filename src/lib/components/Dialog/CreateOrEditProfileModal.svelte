<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { reiverrApi, type ReiverrUser } from '../../apis/reiverr/reiverr-api';
	import TextField from '../TextField.svelte';
	import Button from '../Button.svelte';
	import { ArrowUp, EyeClosed, EyeOpen, Trash, Upload } from 'radix-icons-svelte';
	import Container from '../Container.svelte';
	import IconToggle from '../IconToggle.svelte';
	import Tab from '../Tab/Tab.svelte';
	import { useTabs } from '../Tab/Tab';
	import SelectField from '../SelectField.svelte';
	import ProfileIcon from '../ProfileIcon.svelte';
	import { getRandomProfilePicture, profilePictures } from '../../profile-pictures';
	import { createModal, modalStack } from '../Modal/modal.store';
	import { user as userStore } from '../../stores/user.store';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { sessions } from '../../stores/session.store';
	import { navigate } from '../StackRouter/StackRouter';
	import Toggle from '../Toggle.svelte';
	import { get } from 'svelte/store';

	enum Tabs {
		EditProfile,
		ProfilePictures
	}

	export let modalId: symbol;

	export let user: ReiverrUser | undefined = undefined;
	export let onComplete: () => void = () => {};
	export let createNew = false;
	export let admin = createNew;

	const tab = useTabs(Tabs.EditProfile);

	let name = user?.name || '';
	let oldPassword = '';
	let oldPasswordVisible = false;
	let newPassword = '';
	let newPasswordVisible = false;
	let isAdmin = user?.isAdmin || false;
	let profilePictureFiles: FileList;
	let profilePictureBase64: string = user?.profilePicture ?? getRandomProfilePicture() ?? '';
	let profilePictureTitle: string;
	let profilePictureFilesInput: HTMLInputElement;
	$: {
		const file = profilePictureFiles?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = () => setProfilePicture(reader.result as string);
			reader.readAsDataURL(file);
		}
	}

	$: {
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
	}

	$: stale =
		(name !== user?.name && name !== '') ||
		oldPassword !== newPassword ||
		profilePictureBase64 !== user?.profilePicture ||
		isAdmin !== user?.isAdmin;
	$: complete = name !== '';
	let errorMessage = '';

	function setProfilePicture(image: string) {
		profilePictureBase64 = image;
		tab.set(Tabs.EditProfile);
	}

	async function save() {
		const id = user?.id;

		if (!id) return;

		const error =
			id === get(userStore)?.id
				? await userStore.updateUser((u) => ({
						...u,
						name,
						password: newPassword,
						oldPassword,
						profilePicture: profilePictureBase64,
						isAdmin
						// password: newPassword
				  }))
				: (
						await reiverrApi.updateUser(id, {
							name,
							password: newPassword,
							oldPassword,
							profilePicture: profilePictureBase64,
							isAdmin
						})
				  ).error;

		if (error) {
			errorMessage = error;
		} else {
			modalStack.closeTopmost();
			onComplete();
		}
	}

	async function create() {
		const { error } = await reiverrApi.createUser({
			name,
			password: newPassword,
			isAdmin,
			profilePicture: profilePictureBase64
		});

		if (error) {
			errorMessage = error;
		} else {
			modalStack.closeTopmost();
			onComplete();
		}
	}

	async function handleDeleteAccount() {
		const self = user?.id === get(userStore)?.id;
		const error = await reiverrApi.deleteUser(user?.id);
		if (error) {
			errorMessage = error;
		} else {
			modalStack.close(modalId);
			if (self) {
				sessions.removeSession();
				navigate('/');
			} else onComplete();
		}
	}
</script>

<Dialog class="grid" size={'dynamic'}>
	<Tab {...tab} tab={Tabs.EditProfile} class="space-y-4 max-w-lg">
		<h1 class="h3">
			{createNew ? 'Create Account' : 'Edit Profile'}
		</h1>
		<TextField bind:value={name}>name</TextField>
		<SelectField value={profilePictureTitle} on:clickOrSelect={() => tab.set(Tabs.ProfilePictures)}>
			Profile Picture
		</SelectField>
		{#if !createNew}
			<Container direction="horizontal" class="flex space-x-4 items-end">
				<TextField
					class="flex-1"
					bind:value={oldPassword}
					type={oldPasswordVisible ? 'text' : 'password'}
				>
					Old Password
				</TextField>
				<IconToggle
					on:clickOrSelect={() => (oldPasswordVisible = !oldPasswordVisible)}
					icon={oldPasswordVisible ? EyeOpen : EyeClosed}
				/>
			</Container>
		{/if}
		<Container direction="horizontal" class="flex space-x-4 items-end">
			<TextField
				class="flex-1"
				bind:value={newPassword}
				type={newPasswordVisible ? 'text' : 'password'}
			>
				New Password
			</TextField>
			<IconToggle
				on:clickOrSelect={() => (newPasswordVisible = !newPasswordVisible)}
				icon={newPasswordVisible ? EyeOpen : EyeClosed}
			/>
		</Container>
		{#if isAdmin || admin}
			<div class="flex justify-between">
				<label>Admin</label>
				<Toggle bind:checked={isAdmin}>Admin</Toggle>
			</div>
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
					on:clickOrSelect={() =>
						createModal(ConfirmDialog, {
							header: 'Delete Account',
							body: 'Are you sure you want to delete your account?',
							confirm: handleDeleteAccount
						})}>Delete Account</Button
				>
			{:else}
				<Button type="primary-dark" disabled={!complete} action={create}>Create</Button>
			{/if}
		</Container>
	</Tab>

	<Tab
		{...tab}
		tab={Tabs.ProfilePictures}
		on:back={({ detail }) => {
			tab.set(Tabs.EditProfile);
			detail.stopPropagation();
		}}
	>
		<h1 class="h3 mb-6">Select Profile Picture</h1>
		<Container direction="grid" gridCols={3} class="grid grid-cols-3 gap-4 w-max">
			<ProfileIcon
				url={profilePictures.ana}
				on:clickOrSelect={() => setProfilePicture(profilePictures.ana)}
				focusOnMount={profilePictureBase64 === profilePictures.ana}
			/>
			<ProfileIcon
				url={profilePictures.emma}
				on:clickOrSelect={() => setProfilePicture(profilePictures.emma)}
				focusOnMount={profilePictureBase64 === profilePictures.emma}
			/>
			<ProfileIcon
				url={profilePictures.glen}
				on:clickOrSelect={() => setProfilePicture(profilePictures.glen)}
				focusOnMount={profilePictureBase64 === profilePictures.glen}
			/>
			<ProfileIcon
				url={profilePictures.henry}
				on:clickOrSelect={() => setProfilePicture(profilePictures.henry)}
				focusOnMount={profilePictureBase64 === profilePictures.henry}
			/>
			<ProfileIcon
				url={profilePictures.keanu}
				on:clickOrSelect={() => setProfilePicture(profilePictures.keanu)}
				focusOnMount={profilePictureBase64 === profilePictures.keanu}
			/>
			<ProfileIcon
				url={profilePictures.leo}
				on:clickOrSelect={() => setProfilePicture(profilePictures.leo)}
				focusOnMount={profilePictureBase64 === profilePictures.leo}
			/>
			<ProfileIcon
				url={profilePictures.sydney}
				on:clickOrSelect={() => setProfilePicture(profilePictures.sydney)}
				focusOnMount={profilePictureBase64 === profilePictures.sydney}
			/>
			<ProfileIcon
				url={profilePictures.zendaya}
				on:clickOrSelect={() => setProfilePicture(profilePictures.zendaya)}
				focusOnMount={profilePictureBase64 === profilePictures.zendaya}
			/>
			<ProfileIcon
				url="profile-pictures/leo.webp"
				on:clickOrSelect={() => profilePictureFilesInput?.click()}
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
</Dialog>

<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { reiverrApi, type ReiverrUser } from '../../apis/reiverr/reiverr-api';
	import TextField from '../TextField.svelte';
	import Button from '../Button.svelte';
	import { ArrowUp, EyeClosed, EyeOpen, Upload } from 'radix-icons-svelte';
	import Container from '../../../Container.svelte';
	import IconToggle from '../IconToggle.svelte';
	import Tab from '../Tab/Tab.svelte';
	import { useTabs } from '../Tab/Tab';
	import SelectField from '../SelectField.svelte';
	import ProfileIcon from '../ProfileIcon.svelte';
	import { profilePictures } from '../../profile-pictures';
	import { modalStack } from '../Modal/modal.store';
	import { user as userStore } from '../../stores/user.store';

	enum Tabs {
		EditProfile,
		ProfilePictures
	}

	export let user: ReiverrUser;

	const tab = useTabs(Tabs.EditProfile);

	let name = user?.name || '';
	let oldPassword = '';
	let oldPasswordVisible = false;
	let newPassword = '';
	let newPasswordVisible = false;
	let profilePictureFiles: FileList;
	let profilePictureBase64: string = user.profilePicture;
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
		(name !== user.name && name !== '') ||
		oldPassword !== newPassword ||
		profilePictureBase64 !== user.profilePicture;
	let errorMessage = '';

	function setProfilePicture(image: string) {
		profilePictureBase64 = image;
		tab.set(Tabs.EditProfile);
	}

	async function save() {
		const error = await userStore.updateUser((u) => ({
			...u,
			name,
			password: newPassword,
			oldPassword,
			profilePicture: profilePictureBase64
			// password: newPassword
		}));

		if (error) {
			errorMessage = error;
		} else {
			modalStack.closeTopmost();
		}
	}
</script>

<Dialog class="grid" size={'dynamic'}>
	<Tab {...tab} tab={Tabs.EditProfile} class="space-y-4 max-w-lg">
		<h1 class="header2">Edit Profile</h1>
		<TextField bind:value={name}>name</TextField>
		<SelectField value={profilePictureTitle} on:clickOrSelect={() => tab.set(Tabs.ProfilePictures)}>
			Profile Picture
		</SelectField>
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
		{#if errorMessage}
			<div class="text-red-500 mb-4">{errorMessage}</div>
		{/if}
		<Button type="primary-dark" disabled={!stale} action={save} class="mt-8">Save</Button>
	</Tab>

	<Tab
		{...tab}
		tab={Tabs.ProfilePictures}
		on:back={({ detail }) => {
			tab.set(Tabs.EditProfile);
			detail.stopPropagation();
		}}
	>
		<h1 class="header2 mb-6">Select Profile Picture</h1>
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
			<!--			<Container>-->
			<!--				Select File-->
			<!--				<input type="file" bind:files={profilePictureFiles} accept="image/png, image/jpeg" />-->
			<!--			</Container>-->
		</Container>
	</Tab>
</Dialog>

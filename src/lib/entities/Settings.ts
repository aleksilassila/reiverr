import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'settings' })
export class Settings extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	@Column('boolean', { default: false })
	isSetupDone: boolean;

	// General

	@Column('boolean', { default: true })
	autoplayTrailers: boolean;

	@Column('boolean', { default: true })
	excludeLibraryItemsFromDiscovery: boolean;

	@Column('text', { default: 'en' })
	language: string;

	@Column('text', { default: 'US' })
	region: string;
	@Column('integer', { default: 150 })
	animationDuration: number;

	// Discover
	// @Column()
	// discoverIncludedLanguages: string[];

	@Column('boolean', { default: true })
	discoverFilterBasedOnLanguage: boolean;

	// Sonarr

	@Column('integer', { default: 0 })
	sonarrQualityProfileId: number;

	@Column('integer', { default: 0 })
	sonarrLanguageProfileId: number;

	@Column('text', { default: '/tv' })
	sonarrRootFolderPath: string;

	// Radarr

	@Column('integer', { default: 0 })
	radarrQualityProfileId: number;

	@Column('integer', { default: 0 })
	radarrProfileId: number;

	@Column('text', { default: '/movies' })
	radarrRootFolderPath: string;

	// Jellyfin

	@Column('text', { default: '' })
	jellyfinUserId: string;

	// Playback

	@Column('text', { default: 'reiverr' })
	preferredPlaybackSource: 'reiverr' | 'jellyfin';

	public static async get(name = 'default'): Promise<Settings> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new Settings();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return defaultSettings;
		}

		return settings;
	}
}

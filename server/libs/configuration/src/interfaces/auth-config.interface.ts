export interface AuthConfigInterface {
	jwtSecret: string,
	jwtExpiry: string,
	scopedJwtExpiry: string,
	discordClientId: string,
	discordClientSecret: string,
	discordCallbackUrl: string,
	discordRppCallbackUrl: string,
}

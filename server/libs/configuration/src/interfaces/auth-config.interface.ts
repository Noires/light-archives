export interface AuthConfigInterface {
	jwtSecret: string,
	jwtExpiry: string,
	scopedJwtExpiry: string,
	refreshTokenExpiry: string,
	discordClientId: string,
	discordClientSecret: string,
	discordCallbackUrl: string,
	discordRppCallbackUrl: string,
}

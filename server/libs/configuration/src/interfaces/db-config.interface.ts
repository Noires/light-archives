export interface DbConfigInterface {
	type: string,
	host: string,
	port: number,
	username: string,
	password: string,
	database: string,
	synchronize: boolean,
	logging: boolean | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration')[],
}

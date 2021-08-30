export class UserSignUpDto {
	email: string;

	password: string;

	confirmPassword: string;

	constructor(properties?: Readonly<UserSignUpDto>) {
		if (properties) {
			Object.assign(this, properties);
		}
	}
}

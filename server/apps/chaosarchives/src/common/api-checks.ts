import { UserInfo } from "@app/auth/model/user-info";
import { Role, roleImplies } from "@app/shared/enums/role.enum";
import SharedConstants from "@app/shared/SharedConstants";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

const DOMAIN_REGEX = /^([A-Za-z0-9-]+\.)+[A-Za-z0-9-]+$/;

export function checkCarrdProfile(carrdProfile: string, user: UserInfo): string {
	let valid = true;

	if (carrdProfile !== '') {
		if (!DOMAIN_REGEX.test(carrdProfile)) {
			valid = false;
		} else if (!roleImplies(user.role, Role.TRUSTED)) {
			// For untrusted users, only allow whitelisted domains
			let found = false;

			for (const domain of SharedConstants.carrdDomains) {
				if (carrdProfile.endsWith(`.${domain}`)) {
					found = true;
					break;
				}
			}

			if (!found) {
				valid = false;
			}
		}
	}
	
	if (!valid) {
		throw new BadRequestException('Invalid Carrd profile link');
	}

	return carrdProfile;
}

export function assertUserCharacterId(characterId: number, user: UserInfo): void {
	if (!user.characters.map(ch => ch.id).includes(characterId)) {
		throw new ForbiddenException('Invalid character id');
	}
}
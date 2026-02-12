import { UserInfo } from "@app/auth/model/user-info";
import { Character } from "@app/entity";
import { Role, roleImplies } from "@app/shared/enums/role.enum";
import SharedConstants from "@app/shared/SharedConstants";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { EntityManager, IsNull, Not } from "typeorm";

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

export async function getVerifiedCharacter(
	em: EntityManager,
	characterId: number,
	user: UserInfo,
): Promise<Character> {
	assertUserCharacterId(characterId, user);

	const character = await em.getRepository(Character).findOne({
		where: {
			id: characterId,
			verifiedAt: Not(IsNull()),
			user: { id: user.id },
		},
		relations: ['server'],
	});

	if (!character) {
		throw new BadRequestException('Invalid character ID or character not verified');
	}

	return character;
}
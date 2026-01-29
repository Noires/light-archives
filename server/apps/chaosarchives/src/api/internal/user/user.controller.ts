import { AuthService } from '@app/auth/auth.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { SessionDto } from '@app/shared/dto/user/session.dto';
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { VerifyCharacterDto } from '@app/shared/dto/user/verify-character.dto';
import {
  Body,
  Controller,
  Get, ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private publicAuthService: AuthService,
  ) {}

  @Get('login/discord')
  @UseGuards(AuthGuard('discord'))
  async loginWithDiscord(): Promise<void> {
    return;
  }

  @Get('login/discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(
    @CurrentUser() user: UserInfo,
    @Res() response: Response,
  ): Promise<void> {
    const accessToken = this.publicAuthService.createAccessToken(user.id);
    const redirectUrl = `${serverConfiguration.frontendRoot}/login?token=${encodeURIComponent(accessToken)}`;
    response.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async getSession(@CurrentUser() user: UserInfo): Promise<SessionDto> {
    return this.userService.toSession(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept-terms')
  async acceptTerms(@CurrentUser() user: UserInfo): Promise<void> {
    await this.userService.acceptTerms(user);
    await this.publicAuthService.notifyUserChanged(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verification-status')
  async getVerificationStatus(
    @CurrentUser() user: UserInfo,
    @Query('characterId', ParseIntPipe) characterId: number,
  ): Promise<VerificationStatusDto> {
    return this.userService.getVerificationStatus(user, characterId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-character')
  async verifyCharacter(
    @CurrentUser() user: UserInfo,
    @Body() verifyData: VerifyCharacterDto,
  ): Promise<void> {
    await this.userService.verifyCharacter(user, verifyData);
    await this.publicAuthService.notifyUserChanged(user.id);
  }
}

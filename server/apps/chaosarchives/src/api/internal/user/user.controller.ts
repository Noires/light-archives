import { AuthService } from '@app/auth/auth.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { ChangeEmailRequestDto } from '@app/shared/dto/user/change-email-request.dto';
import { ChangePasswordRequestDto } from '@app/shared/dto/user/change-password-request.dto';
import { ForgotPasswordRequestDto } from '@app/shared/dto/user/forgot-password-request.dto';
import { LoginResponseDto } from '@app/shared/dto/user/login-response.dto';
import { ResetPasswordRequestDto } from '@app/shared/dto/user/reset-password-request.dto';
import { SessionDto } from '@app/shared/dto/user/session.dto';
import { UserConfirmEmailDto } from '@app/shared/dto/user/user-confirm-email.dto';
import { UserEmailInfoDto } from '@app/shared/dto/user/user-email.info.dto';
import { UserSignUpResponseDto } from '@app/shared/dto/user/user-sign-up-response.dto';
import { UserSignUpDto } from '@app/shared/dto/user/user-sign-up.dto';
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { VerifyCharacterDto } from '@app/shared/dto/user/verify-character.dto';
import {
  Body,
  Controller,
  Get, ParseIntPipe,
  GoneException,
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

  @Post('signup')
  async signUp(
    @Body() _signupData: UserSignUpDto,
  ): Promise<UserSignUpResponseDto> {
    throw new GoneException('Password-based signup has been replaced by Discord login.');
  }

  @Post('confirm-email')
  async confirmEmail(
    @Body() _confirmEmailData: UserConfirmEmailDto,
  ): Promise<void> {
    throw new GoneException('Email confirmation has been replaced by Discord login.');
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-confirmation-email')
  async resendConfirmationEmail(@CurrentUser() user: UserInfo): Promise<void> {
    await this.userService.resendConfirmationEmail(user);
  }

  @Post('login')
  async login(@CurrentUser() _user: UserInfo): Promise<LoginResponseDto> {
    throw new GoneException('Password-based login has been replaced by Discord login.');
  }

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

  @Post('forgot-password')
  async forgotPassword(
    @Body() _request: ForgotPasswordRequestDto,
  ): Promise<void> {
    throw new GoneException('Password reset has been replaced by Discord login.');
  }

  @Post('reset-password')
  async resetPassword(@Body() _request: ResetPasswordRequestDto): Promise<void> {
    throw new GoneException('Password reset has been replaced by Discord login.');
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Body() _request: ChangePasswordRequestDto, @CurrentUser() _user: UserInfo): Promise<void> {
    throw new GoneException('Password changes have been replaced by Discord login.');
  }

  @UseGuards(JwtAuthGuard)
  @Get('email')
  async getEmail(@CurrentUser() user: UserInfo): Promise<UserEmailInfoDto> {
    return this.userService.getEmail(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(@Body() _request: ChangeEmailRequestDto, @CurrentUser() _user: UserInfo): Promise<void> {
    throw new GoneException('Email changes have been replaced by Discord login.');
  }

  @Post('confirm-new-email')
  async confirmNewEmail(@Body() _confirmEmailData: UserConfirmEmailDto): Promise<void> {
    throw new GoneException('Email changes have been replaced by Discord login.');
  }
}

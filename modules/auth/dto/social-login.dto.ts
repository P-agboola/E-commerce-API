import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ example: 'google-id-token' })
  idToken: string;
}

export class SocialLoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenType: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  isNewUser: boolean;
}

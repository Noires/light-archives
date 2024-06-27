import { IsString } from "class-validator";

export class BaseCharacterProfileDto {
  // RP fields

  // Profile

  @IsString()
  title: string;

  @IsString()
  nickname: string;

  @IsString()
  profession: string;

  @IsString()
  age: string;

  @IsString()
  pronouns: string;

  @IsString()
  birthplace: string;

  @IsString()
  residence: string;

  @IsString()
  background: string;

  // Appearance

  @IsString()
  haircolor: string;

  @IsString()
  eyecolor: string;

  @IsString()
  skintone: string;

  @IsString()
  build: string;

  @IsString()
  height: string;

  @IsString()
  weight: string;

  @IsString()
  apparentage: string;

  @IsString()
  voice: string;

  @IsString()
  tattoosandscars: string;

  @IsString()
  specialfeatures: string;

  @IsString()
  appearance: string;

  // Personality

  @IsString()
  loves: string;

  @IsString()
  hates: string;

  @IsString()
  slogan: string

  @IsString()
  motivation: string;

  @IsString()
  strengths: string;

  @IsString()
  weaknesses: string;

  @IsString()
  ticks: string;

  // Relationships

  @IsString()
  partners: string;

  @IsString()
  relatives: string;

  @IsString()
  friends: string;

  @IsString()
  acquaintances: string;

  @IsString()
  enemies: string; 

  @IsString()
  past: string;

  // Connections

  @IsString()
  freecompanies: string;
  
  @IsString()
  meetingplaces: string;

  @IsString()
  communities: string;

  @IsString()
  mentioned: string;

  // Rumors

  @IsString()
  commonrumors: string;

  @IsString()
  rarerumors: string;
}

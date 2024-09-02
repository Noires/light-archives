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
  birthday: string;

  @IsString()
  deity: string;

  @IsString()
  family: string;

  @IsString()
  relationsshipstatus: string;

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
  specialfeatures: string;

  @IsString()
  appearance: string;

  @IsString()
  aether: string;

  // Personality

  @IsString()
  personality: string;

  @IsString()
  loves: string;

  @IsString()
  hates: string;

  @IsString()
  wishes: string;

  @IsString()
  fears: string;

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

  // Inventory
  @IsString()
  possession: string;

  @IsString()
  specialitems: string;

  // Relationships

  @IsString()
  partners: string;

  @IsString()
  parents: string;

  @IsString()
  children: string;

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
  openinformation: string;

  @IsString()
  commonrumors: string;

  @IsString()
  rarerumors: string;
}

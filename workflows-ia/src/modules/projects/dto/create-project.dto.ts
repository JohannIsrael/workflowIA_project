import { 
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
 } from "class-validator";

export class CreateProjectDto {
   @IsString()
   @IsNotEmpty()
   name: string;

   @IsString()
   @IsNotEmpty()
   priority: string;

   @IsString()
   @IsOptional()
   backtech: string;    

   @IsString()
   @IsOptional()    
   fronttech: string;

   @IsString()
   @IsOptional()
   cloudTech: string;

   @IsNumber()
   @IsOptional()
   sprintsQuantity: number;

   @IsString()
   @IsOptional()
   endDate: string;
}

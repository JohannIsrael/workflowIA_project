import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { Projects } from 'src/modules/gemini/entities/Projects.entity';

export class UpdateProjectDto extends PartialType(CreateProjectDto){
    
}

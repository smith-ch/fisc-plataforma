import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/enums';
import { publicPath, uploadOptions } from './upload.options';

/** Subida genérica para el panel (logos, imágenes de servicios, portafolio). */
@Controller('uploads')
export class UploadsController {
  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', uploadOptions('content')))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return { url: publicPath('content', file) };
  }
}

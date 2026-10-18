import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UploadedFiles, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { PhotoStage, Role } from '../common/enums';
import { Public, Roles } from '../common/roles.decorator';
import { publicPath, uploadOptions } from '../uploads/upload.options';
import {
  AdminPaymentDto, ChangeStatusDto, ClientPaymentDto, CreateOrderDto, DocumentDto, ProgressUpdateDto, ReviewDto, ReviewPaymentDto,
  StaffOrdersQueryDto, UpdateDocumentDto, UpdateOrderDto,
} from './orders.dto';
import { OrdersService } from './orders.service';

/** Cara al cliente: creación de órdenes, seguimiento y portal "Mi cuenta". */
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Public() @Throttle({ default: { limit: 10, ttl: 600_000 } }) @Post('orders')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.orders.create(dto, user);
  }

  // Códigos secuenciales (ORD-000001): el límite frena la enumeración.
  @Public() @Throttle({ default: { limit: 10, ttl: 60_000 } }) @Get('orders/track')
  track(@Query('code') code: string, @Query('email') email: string) {
    return this.orders.track(code, email);
  }

  @Roles(Role.CLIENT) @Get('my/orders')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.listForClient(user);
  }

  @Roles(Role.CLIENT) @Get('my/orders/:id')
  myOrder(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.orders.detail(id, user);
  }

  @Roles(Role.CLIENT) @Post('my/orders/:id/review')
  review(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: ReviewDto) {
    return this.orders.review(id, user, dto);
  }

  @Roles(Role.CLIENT) @Post('my/orders/:id/payments')
  @UseInterceptors(FileInterceptor('receipt', uploadOptions('receipts')))
  pay(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: ClientPaymentDto,
    @UploadedFile() file?: Express.Multer.File) {
    return this.orders.clientPayment(id, user, dto, file ? publicPath('receipts', file) : null);
  }
}

/** Gestor de órdenes: bandeja de entrada, asignación, estados, fotos y facturación. */
@Controller()
export class StaffOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(Role.ADMIN, Role.TECHNICIAN) @Get('staff/orders')
  list(@CurrentUser() user: AuthUser, @Query() q: StaffOrdersQueryDto) {
    return this.orders.listForStaff(user, q);
  }

  @Roles(Role.ADMIN, Role.TECHNICIAN) @Get('staff/orders/:id')
  detail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.orders.detail(id, user);
  }

  @Roles(Role.ADMIN, Role.TECHNICIAN) @Post('staff/orders/:id/status')
  status(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: ChangeStatusDto) {
    return this.orders.changeStatus(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.TECHNICIAN) @Post('staff/orders/:id/progress')
  @UseInterceptors(FilesInterceptor('photos', 12, uploadOptions('orders')))
  progress(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: ProgressUpdateDto,
    @UploadedFiles() files: Express.Multer.File[] = []) {
    return this.orders.addProgress(id, user, dto.message, dto.stage ?? PhotoStage.DURING, dto.visibleToClient !== 'false',
      files, files.map((f) => publicPath('orders', f)));
  }

  @Roles(Role.ADMIN) @Post('admin/orders')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.create(dto, user);
  }

  @Roles(Role.ADMIN) @Patch('admin/orders/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.update(id, dto, user);
  }

  @Roles(Role.ADMIN) @Delete('admin/photos/:id')
  deletePhoto(@Param('id', ParseIntPipe) id: number) {
    return this.orders.deletePhoto(id);
  }

  @Roles(Role.ADMIN) @Post('admin/orders/:id/documents')
  @UseInterceptors(FileInterceptor('file', uploadOptions('documents')))
  addDocument(@Param('id', ParseIntPipe) id: number, @Body() dto: DocumentDto, @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File) {
    return this.orders.addDocument(id, { ...dto, fileUrl: file ? publicPath('documents', file) : dto.fileUrl }, user);
  }

  @Roles(Role.ADMIN) @Post('admin/orders/:id/documents/sync')
  sync(@Param('id', ParseIntPipe) id: number) {
    return this.orders.syncDocuments(id);
  }

  @Roles(Role.ADMIN) @Patch('admin/documents/:id')
  updateDocument(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocumentDto) {
    return this.orders.updateDocument(id, dto);
  }

  @Roles(Role.ADMIN) @Delete('admin/documents/:id')
  deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.orders.deleteDocument(id);
  }

  @Roles(Role.ADMIN) @Post('admin/orders/:id/payments')
  adminPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminPaymentDto, @CurrentUser() user: AuthUser) {
    return this.orders.adminPayment(id, user, dto);
  }

  @Roles(Role.ADMIN) @Get('admin/payments')
  payments(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.orders.listPayments(status, { page, limit });
  }

  @Roles(Role.ADMIN) @Patch('admin/payments/:id')
  reviewPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewPaymentDto, @CurrentUser() user: AuthUser) {
    return this.orders.reviewPayment(id, user, dto);
  }
}

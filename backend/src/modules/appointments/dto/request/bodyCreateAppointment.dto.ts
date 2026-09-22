import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMilitaryTime,
  IsNumber,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { BodyCreateRelativeDto } from 'src/modules/relatives/dto/request/bodyCreateRelative.dto';

@ValidatorConstraint({ name: 'isValidScheduleSelection', async: false })
export class IsValidScheduleSelectionConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as BodyCreateAppointmentDto;
    const hasSpecific =
      obj.doctor_schedule_id !== undefined && obj.doctor_schedule_id !== null;
    const hasSpecialty =
      obj.specialty_id !== undefined && obj.specialty_id !== null;
    const hasStart = obj.start_time !== undefined && obj.start_time !== null;
    const hasEnd = obj.end_time !== undefined && obj.end_time !== null;

    if (hasSpecific) {
      // Chế độ chọn ca cụ thể: không được kèm field của chế độ tự chọn.
      return !(hasSpecialty || hasStart || hasEnd);
    }
    // Chế độ tự chọn bác sĩ: bắt buộc specialty_id + start_time, end_time tùy chọn.
    return hasSpecialty && hasStart;
  }

  defaultMessage() {
    return 'Yêu cầu đặt lịch không hợp lệ: cung cấp doctor_schedule_id (chọn ca cụ thể) HOẶC cả specialty_id và start_time (tự chọn bác sĩ), không được kết hợp cả hai.';
  }
}

@ValidatorConstraint({ name: 'isValidPatientSelection', async: false })
export class IsValidPatientSelectionConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as BodyCreateAppointmentDto;
    const hasRelativeId =
      obj.relative_id !== undefined && obj.relative_id !== null;
    const hasNewRelativeProfile = obj.new_relative_profile !== undefined;
    return hasRelativeId !== hasNewRelativeProfile;
  }

  defaultMessage() {
    return 'Yêu cầu đặt lịch không hợp lệ: cung cấp relative_id (người thân đã có hồ sơ) HOẶC new_relative_profile (thông tin tạo hồ sơ người thân mới), không được bỏ trống hoặc kết hợp cả hai.';
  }
}

export class BodyCreateAppointmentDto {
  @IsDateString()
  appointment_date!: string;

  @IsOptional()
  @IsNumber()
  doctor_schedule_id?: number;

  @IsOptional()
  @IsNumber()
  specialty_id?: number;

  @IsOptional()
  @IsMilitaryTime()
  start_time?: string;

  @IsOptional()
  @IsMilitaryTime()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  relative_id?: number;

  // Thông tin tạo mới người thân (đi kèm hồ sơ sức khỏe rỗng) ngay trong lúc
  // đặt lịch, dùng khi người dùng/chatbot chưa có relative_id sẵn. Tái dùng
  // nguyên BodyCreateRelativeDto để thừa hưởng validation (fullname,
  // relationship_code, gender bắt buộc; phone, dob tùy chọn) — thiếu field
  // bắt buộc nào, ValidationPipe tự throw lỗi chi tiết field đó, không tự
  // bịa dữ liệu.
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyCreateRelativeDto)
  new_relative_profile?: BodyCreateRelativeDto;

  @IsEnum(BookingMode)
  booking_mode!: BookingMode;

  @IsOptional()
  @IsUUID()
  ai_booking_operation_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  patient_chat_conversation_id?: number;

  // Không phải field payload thực — chỉ là điểm neo cho 2 validator liên-field
  // bên dưới, để chúng luôn chạy bất kể field nào trong nhóm mà chúng kiểm tra
  // (doctor_schedule_id/specialty_id/start_time, relative_id/new_relative_profile)
  // đang undefined. Nếu gắn @Validate lên một field có @IsOptional(), class-validator
  // sẽ bỏ qua toàn bộ validator trên field đó (kể cả @Validate) khi field rỗng —
  // đúng lúc cần rule liên-field chạy nhất (khi cả hai nhánh đều bị thiếu). Field
  // này không có @IsOptional() nên class-validator luôn chạy các @Validate dưới đây.
  //
  // Kiểu KHÔNG được để là `never`: SWC emit design:type = undefined cho `never`
  // (không có constructor thật ở runtime để reflect), khiến
  // @nestjs/swagger's SchemaObjectFactory.createNotBuiltInTypeReference throw
  // "circular dependency detected" ngay khi build schema cho DTO này — sập
  // toàn bộ /api-docs-json (và cả trang Swagger UI). @ApiHideProperty() KHÔNG
  // fix được việc này — bản @nestjs/swagger đang dùng cài đặt decorator đó là
  // no-op thật sự (xem node_modules/@nestjs/swagger/dist/decorators/
  // api-hide-property.decorator.js), giữ lại chỉ để khai báo ý định/tương
  // thích tương lai. `boolean` là kiểu built-in nên SchemaObjectFactory xử lý
  // an toàn ở nhánh isPrimitiveType, không bao giờ chạm createNotBuiltInTypeReference.
  @ApiHideProperty()
  @Validate(IsValidScheduleSelectionConstraint)
  @Validate(IsValidPatientSelectionConstraint)
  private readonly crossFieldValidation?: boolean;
}

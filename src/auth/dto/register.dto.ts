import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/strong-password.validator';

export class RegisterDto {
  @IsOptional()
  name?: string;

  @IsNotEmpty({ message: 'Username must not be empty' })
  username: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsStrongPassword({
    message:
      'A password deve ter: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial (!@#$%^&*)',
  })
  password: string;
}

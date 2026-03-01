import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class StrongPasswordValidator implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    if (password.length < 12) return false;

    if (!/[A-Z]/.test(password)) return false;

    if (!/[a-z]/.test(password)) return false;

    if (!/[0-9]/.test(password)) return false;

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `A password deve ter:
    - Mínimo 12 caracteres
    - Pelo menos 1 letra maiúscula (A-Z)
    - Pelo menos 1 letra minúscula (a-z)
    - Pelo menos 1 número (0-9)
    - Pelo menos 1 carácter especial (!@#$%^&* etc)`;
  }
}

export function IsStrongPassword(
  validationOptions?: ValidationOptions,
) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordValidator,
    });
  };
}

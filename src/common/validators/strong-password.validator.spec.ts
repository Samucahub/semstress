import { StrongPasswordValidator } from './strong-password.validator';

describe('StrongPasswordValidator', () => {
  let validator: StrongPasswordValidator;

  beforeEach(() => {
    validator = new StrongPasswordValidator();
  });

  describe('validate', () => {
    it('deve aceitar uma password válida e forte', () => {
      const strongPassword = 'MyStr0ng!Password';

      expect(validator.validate(strongPassword, null)).toBe(true);
    });

    it('deve aceitar password com diferentes caracteres especiais', () => {
      const passwords = [
        'Pass@word123',
        'Pass#word123',
        'Pass$word123',
        'Pass%word123',
        'Pass^word123',
        'Pass&word123',
        'Pass*word123',
        'Pass(word)123',
        'Pass-word_123',
        'Pass=word+123',
        'Pass[word]123',
        'Pass{word}123',
        'Pass|word\\123',
        'Pass:word;123',
        'Pass"word\'123',
        'Pass<word>123',
        'Pass?word/123',
      ];

      passwords.forEach((password) => {
        expect(validator.validate(password, null)).toBe(true);
      });
    });

    it('deve rejeitar password vazia', () => {
      expect(validator.validate('', null)).toBe(false);
    });

    it('deve rejeitar password null', () => {
      expect(validator.validate(null, null)).toBe(false);
    });

    it('deve rejeitar password com menos de 12 caracteres', () => {
      expect(validator.validate('Pass@123', null)).toBe(false);
      expect(validator.validate('Pass@12345', null)).toBe(false);
      expect(validator.validate('Pass@1234', null)).toBe(false);
    });

    it('deve rejeitar password sem letra maiúscula', () => {
      expect(validator.validate('password@123', null)).toBe(false);
    });

    it('deve rejeitar password sem letra minúscula', () => {
      expect(validator.validate('PASSWORD@123', null)).toBe(false);
    });

    it('deve rejeitar password sem número', () => {
      expect(validator.validate('Password@abc', null)).toBe(false);
    });

    it('deve rejeitar password sem carácter especial', () => {
      expect(validator.validate('Password123', null)).toBe(false);
    });

    it('deve aceitar password com exatamente 12 caracteres', () => {
      expect(validator.validate('Pass@word123', null)).toBe(true);
    });

    it('deve aceitar password muito longa', () => {
      expect(
        validator.validate(
          'VeryLongAndComplicated!Password1WithManyCharacters',
          null,
        ),
      ).toBe(true);
    });

    it('deve rejeitar password com espaços apenas', () => {
      expect(validator.validate('            ', null)).toBe(false);
    });

    it('deve rejeitar password com números e letras mas sem carácter especial', () => {
      expect(validator.validate('Password123abc', null)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('deve retornar mensagem de erro clara', () => {
      const message = validator.defaultMessage(null);

      expect(message).toContain('Mínimo');
      expect(message).toContain('12 caracteres');
      expect(message).toContain('maiúscula');
      expect(message).toContain('minúscula');
      expect(message).toContain('número');
      expect(message).toContain('especial');
    });
  });
});

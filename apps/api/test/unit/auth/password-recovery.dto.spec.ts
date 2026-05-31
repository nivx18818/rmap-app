import { validate } from 'class-validator';

import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';

describe('Password recovery DTOs', () => {
  it('should reject an invalid forgot-password email', async () => {
    const dto = new ForgotPasswordDto();
    dto.email = 'not-an-email';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('email');
  });

  it('should reject a weak reset password', async () => {
    const dto = new ResetPasswordDto();
    dto.token = 'reset-token';
    dto.newPassword = 'short';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('newPassword');
    expect(errors[0]?.constraints).toHaveProperty('minLength');
  });
});

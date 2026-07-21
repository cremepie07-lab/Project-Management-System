"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetLink = `${BASE_URL}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: "WorkFlow <onboarding@resend.dev>",
        to: normalizedEmail,
        subject: "Đặt lại mật khẩu WorkFlow",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #030712; color: #e5e7eb;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0;">WorkFlow</h1>
            </div>
            <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 12px;">Đặt lại mật khẩu</h2>
            <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin: 0 0 24px;">
              Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau 1 giờ.
            </p>
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(to right, #9333ea, #2563eb); color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
              Đặt lại mật khẩu
            </a>
            <p style="font-size: 12px; color: #6b7280; line-height: 1.6; margin: 0;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
            </p>
          </div>
        `,
      });
    } catch {
      // Even if email fails, don't reveal that to the user
    }
  }

  return {
    success: true,
    message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.",
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "Liên kết đặt lại mật khẩu không hợp lệ." };
  }

  if (resetToken.usedAt) {
    return { error: "Liên kết đặt lại mật khẩu đã được sử dụng." };
  }

  if (new Date() > resetToken.expiresAt) {
    return { error: "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}

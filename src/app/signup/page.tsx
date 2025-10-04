"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignup } from "@/features/auth/hooks/useSignup";
import { RoleSelector } from "@/features/auth/components/role-selector";
import { TermsConsent } from "@/features/auth/components/terms-consent";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { validatePassword } from "@/lib/validation/password";
import { formatPhoneInput, validatePhone } from "@/lib/validation/phone";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { SignupRequest } from "@/features/auth/lib/dto";

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useCurrentUser();
  const signupMutation = useSignup();

  const [formState, setFormState] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: null as "learner" | "instructor" | null,
    fullName: "",
    phoneNumber: "",
    termsConsent: { service: false, privacy: false },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isSignupInProgress, setIsSignupInProgress] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isSignupInProgress) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, isSignupInProgress, router, searchParams]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.email.trim()) {
      errors.email = "이메일을 입력해주세요.";
    }

    const passwordValidation = validatePassword(formState.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message!;
    }

    if (formState.password !== formState.confirmPassword) {
      errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    if (!formState.role) {
      errors.role = "역할을 선택해주세요.";
    }

    if (!formState.fullName.trim()) {
      errors.fullName = "이름을 입력해주세요.";
    }

    const phoneValidation = validatePhone(formState.phoneNumber);
    if (!phoneValidation.valid) {
      errors.phoneNumber = phoneValidation.message!;
    }

    if (!formState.termsConsent.service || !formState.termsConsent.privacy) {
      errors.terms = "필수 약관에 동의해주세요.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSignupInProgress(true);

      const signupData: SignupRequest = {
        email: formState.email,
        password: formState.password,
        role: formState.role!,
        fullName: formState.fullName,
        phoneNumber: formState.phoneNumber,
        termsConsent: formState.termsConsent,
      };

      signupMutation.mutate(signupData, {
        onSuccess: async (data) => {
          try {
            const supabase = getSupabaseBrowserClient();
            
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: formState.email,
              password: formState.password,
            });

            if (signInError) {
              console.error("Auto sign-in error:", signInError);
              setErrorMessage("회원가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.");
              setErrorDialogOpen(true);
              setIsSignupInProgress(false);
              
              setTimeout(() => {
                router.push("/login");
              }, 2000);
              return;
            }

            await refresh();
            
            setSuccessDialogOpen(true);
            
            setTimeout(() => {
              setSuccessDialogOpen(false);
              setIsSignupInProgress(false);
              router.push(data.redirectUrl);
            }, 1500);
          } catch (error) {
            console.error("Signup success handler error:", error);
            setErrorMessage("회원가입은 완료되었으나 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.");
            setErrorDialogOpen(true);
            setIsSignupInProgress(false);
            
            setTimeout(() => {
              router.push("/login");
            }, 2000);
          }
        },
        onError: (error) => {
          setErrorMessage(extractApiErrorMessage(error, "회원가입에 실패했습니다."));
          setErrorDialogOpen(true);
          setIsSignupInProgress(false);
        },
      });
    },
    [formState, validateForm, signupMutation, refresh, router]
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setFormState((prev) => ({ ...prev, phoneNumber: formatted }));
  };

  if (isAuthenticated && !isSignupInProgress) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">
          학습자 또는 강사로 가입하여 LMS 플랫폼을 시작하세요.
        </p>
      </header>

      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              역할 선택 *
            </label>
            <RoleSelector
              value={formState.role}
              onChange={(role) => setFormState((prev) => ({ ...prev, role }))}
              disabled={signupMutation.isPending}
            />
            {validationErrors.role && (
              <p className="mt-1 text-sm text-rose-500">{validationErrors.role}</p>
            )}
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이메일 *
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formState.email}
              onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {validationErrors.email && (
              <span className="text-rose-500">{validationErrors.email}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호 *
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {validationErrors.password && (
              <span className="text-rose-500">{validationErrors.password}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            비밀번호 확인 *
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formState.confirmPassword}
              onChange={(e) => setFormState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {validationErrors.confirmPassword && (
              <span className="text-rose-500">{validationErrors.confirmPassword}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이름 *
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              required
              value={formState.fullName}
              onChange={(e) => setFormState((prev) => ({ ...prev, fullName: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {validationErrors.fullName && (
              <span className="text-rose-500">{validationErrors.fullName}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            휴대폰 번호 *
            <input
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              required
              placeholder="010-1234-5678"
              value={formState.phoneNumber}
              onChange={handlePhoneChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
            {validationErrors.phoneNumber && (
              <span className="text-rose-500">{validationErrors.phoneNumber}</span>
            )}
          </label>

          <div>
            <TermsConsent
              value={formState.termsConsent}
              onChange={(termsConsent) => setFormState((prev) => ({ ...prev, termsConsent }))}
              disabled={signupMutation.isPending}
            />
            {validationErrors.terms && (
              <p className="mt-1 text-sm text-rose-500">{validationErrors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {signupMutation.isPending ? "가입 중..." : "회원가입"}
          </button>

          <p className="text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-700 underline hover:text-slate-900"
            >
              로그인으로 이동
            </Link>
          </p>
        </form>

        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/signup-onboarding/800/1000"
            alt="회원가입"
            width={800}
            height={1000}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>

      <ErrorDialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        title="회원가입 실패"
        message={errorMessage}
      />

      <SuccessDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        title="회원가입 완료"
        message="회원가입이 완료되었습니다. 잠시 후 페이지가 이동됩니다."
      />
    </div>
  );
}

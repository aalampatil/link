import { SignIn } from "@clerk/react";
import AuthLayout from "@/components/AuthLayout";

export default function SignInPage() {
  return <AuthLayout><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/get-all" /></AuthLayout>;
}

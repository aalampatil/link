import { SignUp } from "@clerk/react";
import AuthLayout from "@/components/AuthLayout";

export default function SignUpPage() {
  return <AuthLayout><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/get-all" /></AuthLayout>;
}

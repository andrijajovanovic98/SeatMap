import { LoginForm } from "@/components/LoginForm";
import { LanguageProvider } from "@/context/LanguageContext";

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginForm />
    </LanguageProvider>
  );
}

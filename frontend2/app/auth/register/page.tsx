import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Shiv Accounts Cloud</h1>
          <p className="text-muted-foreground mt-2">Modern accounting system for your business</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

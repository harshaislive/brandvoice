import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Image src="/logo.png" alt="Beforest" width={150} height={54} className="mx-auto h-auto w-[150px]" priority />
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Beforest Brand Voice</p>
          <h1 className="text-3xl font-serif">Access is invitation-only</h1>
          <p className="text-muted-foreground">A Beforest administrator creates accounts and shares login details with approved users.</p>
        </div>
        <Link href="/auth/login" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Go to sign in
        </Link>
      </div>
    </main>
  )
}

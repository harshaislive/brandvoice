import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] p-6">
      <div className="w-full max-w-md text-center">
        <Image src="/logo.png" alt="Beforest" width={150} height={54} className="mx-auto h-auto w-[150px]" priority />
        <div className="mt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#496a50]">Beforest Brand Voice</p>
          <h1 className="mt-4 font-serif text-[42px] font-light leading-tight tracking-[-0.02em] text-[#26372b]">Access is invitation-only.</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#6f6a61]">A Beforest administrator creates each account and shares the login details with approved users.</p>
        </div>
        <Link href="/" className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-[#3b6345] px-7 text-sm font-medium text-[#faf8f2] hover:bg-[#314f39]">
          Go to sign in
        </Link>
      </div>
    </main>
  )
}

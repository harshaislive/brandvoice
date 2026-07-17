'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginHome() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/transform')
  }, [isAuthenticated, isLoading, router])

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back', { description: 'Opening your Brand Voice workspace.' })
      router.replace('/transform')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3]" aria-live="polite">
        <div className="flex flex-col items-center gap-5 text-[#496a50]">
          <Image src="/logo.png" alt="Beforest" width={154} height={41} priority className="h-auto w-[148px]" />
          <LoaderCircle className="brand-spinner h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Opening Brand Voice</span>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f4eee3] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#314536] p-14 text-[#f7f2e9] lg:flex xl:p-20" aria-label="About Beforest Brand Voice">
        <Image src="/logo.png" alt="Beforest" width={154} height={41} className="h-auto w-[148px] brightness-0 invert" priority />
        <div className="max-w-[610px] pb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#cbd5c6]">Beforest Brand Voice</p>
          <h1 className="mt-6 font-serif text-[58px] font-light leading-[1.03] tracking-[-0.025em] xl:text-[70px]">A clearer voice,<br />rooted in who we are.</h1>
          <p className="mt-7 max-w-md text-[16px] leading-7 text-[#d8dfd5]">Refine every message into a consistent Beforest voice—without losing the original thought.</p>
        </div>
        <div className="border-t border-[#657568] pt-5 text-xs text-[#b8c3b5]">An internal Beforest tool</div>
      </section>

      <section className="flex min-h-screen flex-col bg-[#f4eee3] px-6 py-8 sm:px-12 lg:justify-center lg:px-16 xl:px-24" aria-labelledby="sign-in-heading">
        <Image src="/logo.png" alt="Beforest" width={154} height={41} priority className="mb-16 h-auto w-[138px] lg:hidden" />
        <div className="w-full max-w-[430px] lg:mx-auto">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfc6b8] text-[#496a50]"><LockKeyhole className="h-4 w-4" strokeWidth={1.6} /></span>
          <h2 id="sign-in-heading" className="mt-7 font-serif text-[42px] font-light tracking-[-0.02em] text-[#26372b]">Welcome back.</h2>
          <p className="mt-2 text-[15px] text-[#6f6a61]">Sign in to continue to Brand Voice.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#39372f]">Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="name@company.com" className="h-12 border-[#d1c8ba] bg-[#faf8f2] px-4 shadow-none placeholder:text-[#9a9388] focus:border-[#496a50]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#39372f]">Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" placeholder="••••••••" className="h-12 border-[#d1c8ba] bg-[#faf8f2] px-4 shadow-none placeholder:text-[#9a9388] focus:border-[#496a50]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="h-12 w-full gap-2 rounded-lg bg-[#3b6345] text-[15px] font-medium text-[#faf8f2] shadow-none hover:bg-[#314f39]">
                {isSubmitting ? <><LoaderCircle className="brand-spinner h-4 w-4" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4" strokeWidth={1.7} /></>}
              </Button>
            </form>
          </Form>

          <p className="mt-8 border-t border-[#d8d0c3] pt-6 text-center text-xs leading-6 text-[#817b71]">Access is invitation-only.<br />Ask a Beforest administrator for an account.</p>
        </div>
      </section>
    </main>
  )
}

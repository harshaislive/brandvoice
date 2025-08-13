'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const result = await response.json()
      
      // Use auth context to set user and token
      localStorage.setItem('auth_token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      
      // Log the user in via context
      await login(data.email, data.password)
      
      toast.success('Account created successfully!')
      router.push('/')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">
            Beforest
          </h1>
          <p className="text-muted-foreground">
            Create your Brand Voice Transformer account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Choose a username"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be your unique identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is how you&apos;ll appear in the app
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-accent/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium mb-2">🚀 Get Started Today</h3>
              <p className="text-sm text-muted-foreground">
                Join thousands of users transforming their content with 
                authentic Beforest brand voice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
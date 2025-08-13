import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg mx-auto text-center">
        <CardHeader>
          <div className="text-6xl mb-4">🤔</div>
          <CardTitle>Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist in the Beforest Brand Voice Transformer.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/">
              <Button>
                Go Home
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline">
                View History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
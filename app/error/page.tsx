import { Card, CardContent } from '@/components/ui/card'

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <h1 className="text-2xl font-bold">This Link Isn&apos;t Valid</h1>
          <p className="text-muted-foreground">
            This link isn&apos;t valid. Text Daniel at{' '}
            <a href="sms:+17024129233" className="text-primary underline">
              +1 (702) 412-9233
            </a>{' '}
            if you need help.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

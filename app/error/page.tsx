import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_center,_#0E0E14_0%,_#07070A_70%)] text-foreground flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border-border/50 bg-card/80">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div>
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 mx-auto mb-4 flex items-center justify-center">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">This Link Isn&apos;t Valid</h1>
          </div>
          <p className="text-muted-foreground">
            This link isn&apos;t valid. Text Daniel at{' '}
            <a href="sms:+14049394848" className="text-primary underline">
              (404) 939-4848
            </a>{' '}
            if you need help.
          </p>
          <a href="https://badaaas.com" className="block">
            <Button variant="secondary" className="w-full min-h-[44px]">Go to BadAAAS</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

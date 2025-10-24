import { Button } from '@/shared/components'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_datingLayout/소개팅')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Button
        size="lg"
        type="button"
        onClick={() => navigate({ to: '/result' })}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
      >
        Client 클라이언트
      </Button>
      <video
        autoPlay
        muted
        playsInline
        loop
        style={{ width: '100vw', height: '100vh', objectFit: 'cover' }}
      >
        <source src="/video/normal.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

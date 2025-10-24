import { Button } from '@/shared/components'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_mainLayout/main')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return (
    <>
      <div>welcome main</div>
      <Button
        size="lg"
        type="button"
        onClick={() => navigate({ to: '/select' })}
      >
        Client 클라이언트
      </Button>
    </>
  )
}

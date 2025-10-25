import { VolumeInput } from '@/features/소개팅/VolumeInput/components/VolumeInput'
import VolumeMeter from '@/features/소개팅/VolumeMeter/components/VolumeMeter'
import { Button } from '@/shared/components'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/_datingLayout/소개팅')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [volumeLevel, setVolumeLevel] = useState(0)

  const submitCallback = (audioBlob: Blob) => {
    // 녹음이 완료되었을 때 처리할 로직 작성
    console.log('녹음 완료:', audioBlob)
  }

  const volumeChangeCallback = (level: number) => {
    // 볼륨 변화 시 처리할 로직 작성
    console.log('볼륨 변화:', level)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <VolumeInput
        setVolumeLevel={setVolumeLevel}
        onSubmit={submitCallback}
        onVolumeChange={volumeChangeCallback}
      />
      <Button
        size="lg"
        type="button"
        onClick={() => navigate({ to: '/result' })}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          opacity: 0.8,
          borderRadius: '90px',
        }}
        variant="sub"
      >
        정민지 📞✖️
      </Button>
      <VolumeMeter
        level={volumeLevel}
        height={250}
        width={50}
        label="마이크"
        showValue={true}
      />
      <video
        autoPlay
        muted
        playsInline
        loop
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -1,
        }}
      >
        <source src="/video/normal.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

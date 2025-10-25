import { useEffect, useRef, useState } from 'react'
import { vars } from '@/vars.css'

interface VolumeInputProps {
  /** 침묵으로 간주할 볼륨 임계값 (0-100, 기본: 5) */
  silenceThreshold?: number
  /** 침묵 지속 시간 (ms, 기본: 2000) */
  silenceDuration?: number
  /** 녹음 완료 시 콜백 */
  onSubmit?: (audioBlob: Blob) => void
  /** 볼륨 변화 콜백 */
  onVolumeChange?: (level: number) => void
  setVolumeLevel: (level: number) => void
}

export function VolumeInput({
  silenceThreshold = 5,
  silenceDuration = 2000,
  onSubmit,
  onVolumeChange,
  setVolumeLevel,
}: VolumeInputProps) {
  const [message, setMessage] = useState('시작 대기중...')
  const [isRecording, setIsRecording] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null) // 🎯 추가
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null) // 🎯 추가

  // 오디오 볼륨 분석
  const analyzeVolume = () => {
    if (!analyserRef.current || !isRecording) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const sum = dataArray.reduce((acc, val) => acc + val * val, 0)
    const rms = Math.sqrt(sum / dataArray.length)
    const level = Math.min(100, (rms / 128) * 100)

    setVolumeLevel(level)
    onVolumeChange?.(level)

    // 침묵 감지
    if (level < silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = window.setTimeout(() => {
          stopRecording()
        }, silenceDuration)
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }

    // 🎯 계속 반복
    animationFrameRef.current = requestAnimationFrame(analyzeVolume)
  }

  const startRecording = async () => {
    try {
      setMessage('마이크 접근 중...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // AudioContext 설정
      audioContextRef.current = new AudioContext()
      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream) // 🎯 ref 저장
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      sourceRef.current.connect(analyserRef.current)

      // MediaRecorder 설정
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
      })

      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        onSubmit?.(audioBlob)
        setMessage('제출 완료!')
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setMessage('녹음 중... (말씀해주세요)')

      // 🎯 볼륨 분석 시작
      analyzeVolume()
    } catch (error) {
      console.error('마이크 접근 실패:', error)
      setMessage('마이크 권한이 필요합니다')
    }
  }

  const stopRecording = () => {
    setMessage('처리 중...')

    // 🎯 animation frame 먼저 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsRecording(false)

    // 타이머 정리
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    // MediaRecorder 중지
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop())
    }

    // 🎯 Source disconnect
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    // AudioContext 종료
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setVolumeLevel(0)
  }

  useEffect(() => {
    startRecording()

    return () => {
      stopRecording()
    }
  }, []) // 🤔 의도한 거면 OK

  return (
    <div
      style={{
        position: 'absolute',
        left: '20px',
        top: '10px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.md,
        padding: vars.spacing.md,
        backgroundColor: vars.colors.mainXLight,
        borderRadius: vars.radius.lg,
        border: `2px solid ${vars.colors.mainBorder}`,
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: vars.font.weight.medium,
          color: vars.colors.label,
        }}
      >
        {message}
      </div>
    </div>
  )
}

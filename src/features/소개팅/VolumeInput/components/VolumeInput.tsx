import { useEffect, useRef, useState } from 'react'
import { vars } from '@/vars.css'

interface VolumeInputProps {
  /** 녹음 완료 시 콜백 */
  onSubmit?: (audioBlob: Blob) => void
  /** 볼륨 변화 콜백 */
  onVolumeChange?: (level: number) => void
  setVolumeLevel: (level: number) => void
}

const silenceThreshold = 0.0001
const speechStartThreshold = 0.00001
const silenceDuration = 2000

export function VolumeInput({
  onSubmit,
  onVolumeChange,
  setVolumeLevel,
}: VolumeInputProps) {
  const [message, setMessage] = useState('시작 대기중...')
  const [isRecording, setIsRecording] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isRecordingRef = useRef(false)
  const hasSpeechStartedRef = useRef(false)

  // 오디오 볼륨 분석
  const analyzeVolume = () => {
    if (!analyserRef.current || !isRecordingRef.current) {
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // RMS (Root Mean Square) 계산
    const sum = dataArray.reduce((acc, val) => acc + val * val, 0)
    const rms = Math.sqrt(sum / dataArray.length)
    const level = Math.min(100, (rms / 128) * 100) // 0-100으로 정규화

    setVolumeLevel(level)
    onVolumeChange?.(level)

    if (!hasSpeechStartedRef.current) {
      if (level >= speechStartThreshold) {
        hasSpeechStartedRef.current = true
        setMessage('말씀 중... (침묵하면 자동 종료)')
        console.log('음성 감지 침묵 감지 시작')
      }
    } else {
      if (level < silenceThreshold) {
        // 침묵 시작
        if (!silenceTimerRef.current) {
          console.log('침묵 시작 - 타이머 시작')
          silenceTimerRef.current = window.setTimeout(() => {
            console.log('침묵으로 인한 녹음 종료')
            stopRecording()
          }, silenceDuration)
        }
      } else {
        // 소리 감지 - 침묵 타이머 리셋
        if (silenceTimerRef.current) {
          console.log('소리 감지 - 침묵 타이머 리셋')
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeVolume)
  }

  // 녹음 시작
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
        audioContextRef.current.createMediaStreamSource(stream)
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
        startRecording()
      }

      mediaRecorderRef.current.start(100) // 100ms마다 데이터 수집

      isRecordingRef.current = true
      hasSpeechStartedRef.current = false
      setIsRecording(true)
      setMessage('말씀해주세요... (음성을 기다리는 중)')

      analyzeVolume()
    } catch (error) {
      console.error('마이크 접근 실패:', error)
      setMessage('마이크 권한이 필요합니다')
    }
  }

  // 녹음 중지
  const stopRecording = () => {
    setMessage('처리 중...')

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    isRecordingRef.current = false
    hasSpeechStartedRef.current = false
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

  // 컴포넌트 마운트 시 자동 시작
  useEffect(() => {
    startRecording()

    return () => {
      stopRecording()
    }
  }, [])

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

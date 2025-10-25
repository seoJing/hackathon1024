export interface AnalyzeAudioRequest {
  audioBlob: Blob
}

export interface AnalyzeAudioResponse {
  success: boolean
  audio: string
}

export const analyzeAudio = async (
  request: AnalyzeAudioRequest,
): Promise<AnalyzeAudioResponse> => {
  const formData = new FormData()

  const audioFile = new File(
    [request.audioBlob],
    `recording_${Date.now()}.webm`,
    { type: request.audioBlob.type },
  )

  formData.append('audio', audioFile)

  const response = await fetch('http://localhost:8000/voice-chat', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  return response.json()
}


from aiortc import MediaStreamTrack, AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
import numpy as np
import torchaudio
import torch
import scipy.signal
from faster_whisper import WhisperModel
torch.set_num_threads(1)

class VideoTransformTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    """

    kind = "video"
    cnt = 0
    def __init__(self, track: MediaStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track

    async def recv(self):
        frame = await self.track.recv()
        # self.cnt+=1
        # print(self.cnt)
        return frame

class AudioTransformTrack(AudioStreamTrack):
    """
    An audio stream track that transforms frames from an another track.
    """

    kind = "audio"
    cnt =0
    concat = False
    audio_data = []
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad')
    # (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils
    MODEL_TYPE, RUN_TYPE, COMPUTE_TYPE, NUM_WORKERS, CPU_THREADS, WHISPER_LANG = "tiny.en", "cpu", "int8", 10, 4, "en"
    whisper_model = WhisperModel(
        model_type=MODEL_TYPE,
        device=RUN_TYPE,
        compute_type=COMPUTE_TYPE,
        num_workers=NUM_WORKERS,
        cpu_threads=CPU_THREADS,
        download_root="./models"
    )

    def __init__(self, track: AudioStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track

    def int2float(self, sound):
        abs_max = np.abs(sound).max()
        sound = sound.astype('float32')
        if abs_max > 0:
            sound *= 1/32768
        sound = sound.squeeze()  # depends on the use case
        return sound

    def resample_audio(self, audio_data, original_rate, target_rate=16000):
        """Resample the audio to the target sample rate."""
        # Resample audio using scipy's signal.resample
        num_samples = int(len(audio_data) * target_rate / original_rate)
        resampled_audio = scipy.signal.resample(audio_data, num_samples)
        
        return resampled_audio

    async def recv(self):
        frame: AudioFrame = await self.track.recv()
            
        frameNP = frame.to_ndarray()


        # print(audio_data.shape)
        frameNP = frameNP.reshape(-1, 2)
        # print(audio_data)
        
        if(frame.layout.name == "stereo"):
            frameNP = np.mean(frameNP, axis=1)
        # print(frameNP.shape)

        if(frame.sample_rate != 16000):
            frameNP = self.resample_audio(frameNP, frame.sample_rate)

        if(self.concat):
            self.audio_data = np.concatenate((self.audio_data, frameNP))
            self.concat = False
            # print(f"Resampled audio: {self.audio_data.shape}")
            audioFolat32 = self.int2float(self.audio_data)
            audioFolat32 = audioFolat32[:512]
            # print(audioFolat32.shape)
            new_confidence = self.model(torch.from_numpy(audioFolat32), 16000).item()
            print(f"Confidence: {new_confidence}")
        else:
            self.audio_data = frameNP
            self.concat = True

      
        print(f"Frame: {frame.sample_rate} Format: {frame.format} Samples: {frame.samples} Layout: {frame.layout.name}",)
        return frame
import io
import os
from aiortc import MediaStreamTrack, AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
from pydub import AudioSegment
import numpy as np
import requests
import torchaudio
import torch
import scipy.signal
from faster_whisper import WhisperModel
from dotenv import load_dotenv
import asyncio
from fastapi.concurrency import run_in_threadpool
from concurrent.futures import ThreadPoolExecutor
load_dotenv()
torch.set_num_threads(1)


class VideoTransformTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    """

    kind = "video"
    cnt = 0
    executor = None
    def __init__(self, track: MediaStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track
        self.executor = ThreadPoolExecutor()

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
    endFrameCnt = 0
    concat = False
    audio_data = []
    audio_buffer = []
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad')
    (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils
    MODEL_TYPE, RUN_TYPE, COMPUTE_TYPE, NUM_WORKERS, CPU_THREADS, WHISPER_LANG = "tiny.en", "cpu", "int8", 10, 8, "en"
    whisper_model = WhisperModel(
        model_size_or_path=MODEL_TYPE,
        device=RUN_TYPE,
        compute_type=COMPUTE_TYPE,
        num_workers=NUM_WORKERS,
        cpu_threads=CPU_THREADS,
        download_root="./models"
    )
    
    def __init__(self, track: AudioStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track
        # self.whisper_model = whisper_model 

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
    
    def float32_to_mp3(self, audio_buffer, sample_rate=16000):
        """
        Convert a float32 audio buffer to MP3 format in memory.
        
        :param audio_buffer: The audio buffer as a numpy array.
        :param sample_rate: The sample rate of the audio buffer.
        :return: A BytesIO object containing the MP3 data.
        """
        # Convert numpy array to raw audio
        audio_segment = AudioSegment(
            audio_buffer.tobytes(),
            frame_rate=sample_rate,
            sample_width=audio_buffer.dtype.itemsize,
            channels=1  # Mono
        )
        # Export to a BytesIO object
        mp3_buffer = io.BytesIO()
        audio_segment.export(mp3_buffer, format="mp3")
        mp3_buffer.seek(0)  # Reset pointer to the start
        return mp3_buffer
    
    async def transcribe_audio(self, audio_buffer):
        """
        Perform transcription using whisper_model in a separate thread.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self.executor,
            self._transcribe_audio_sync,  # The synchronous method
            audio_buffer
        )
    
    def _transcribe_audio_sync(self, audio_buffer):
        """
        Synchronous transcription logic for running in a thread.
        """
        print(f"After Audio Buffer Type: {type(audio_buffer)} Audio Buffer Shape: {audio_buffer.shape}")
        segments, _ = self.whisper_model.transcribe(audio_buffer, language=self.WHISPER_LANG)
        segments = [s.text for s in segments]
        transcription = " ".join(segments)
        print(f"Transcription: {transcription}")
        return transcription

    async def recv(self):
        frame: AudioFrame = await self.track.recv()
            
        frameNP = frame.to_ndarray()
        # constantly getting frames need to have states 
        # Silence; Speaking; Speaking_Stopped

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
            audioFloat32 = self.int2float(self.audio_data)
            audioFloat32_512 = audioFloat32[:512]
            # print(audioFolat32.shape)
            # print("audioFloat32 type: ", type(audioFloat32), "Element: ", audioFloat32[0], "Shape: ", audioFloat32.shape)

            new_confidence = self.model(torch.from_numpy(audioFloat32_512), 16000).item()
            new_confidence = (int) (round(new_confidence, 1) * 10)
            if(new_confidence > 0):
                self.endFrameCnt = 0
                self.audio_buffer.append(audioFloat32)
                print(f"Confidence: {new_confidence:02d} {'=' * new_confidence}> : Cnt: {len(self.audio_buffer)}")
            else:
                if(len(self.audio_buffer) <= 1):
                    self.audio_buffer = [audioFloat32]

                elif(len(self.audio_buffer) > 1):
                    if(self.endFrameCnt < 20):
                        self.endFrameCnt += 1
                        self.audio_buffer.append(audioFloat32)
                    else:
                        print(f"AUDIO BEFFER TO TRANSCRIBE: ", len(self.audio_buffer))
                        if(len(self.audio_buffer) > 25):
                            self.audio_buffer = np.concatenate(self.audio_buffer)

                            transcription = await run_in_threadpool(self._transcribe_audio_sync, self.audio_buffer)
                            
                            # print(f"After  Audio Buffer Type: {type(self.audio_buffer)} Audio Buffer Shape: {self.audio_buffer.shape}")
                            # segments, _ = self.whisper_model.transcribe(self.audio_buffer, language=self.WHISPER_LANG)
                            # segments = [s.text for s in segments]
                            # transcription = " ".join(segments)
                            print(f"Transcription: {transcription}")

                            # openai_response = self.transcribe_audio_from_buffer(self.audio_buffer)
                            # print(f"OpenAI Response: {openai_response}")

                        self.audio_buffer = []
                        self.endFrameCnt = 0 

        else:
            self.audio_data = frameNP
            self.concat = True

      
        # print(f"Frame: {frame.sample_rate} Format: {frame.format} Samples: {frame.samples} Layout: {frame.layout.name}",)
        return frame
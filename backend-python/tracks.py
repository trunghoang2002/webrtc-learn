import io
import os
from aiortc import MediaStreamTrack, AudioStreamTrack, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer
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
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
from openai import OpenAI
import random
load_dotenv()
torch.set_num_threads(1)

print("Entered Tracks.py")
client = OpenAI()
print(f"STARTING NEW: {os.getpid()} OpenAiClient: {client}")
whisper_model = None
MODEL_TYPE, RUN_TYPE, COMPUTE_TYPE, NUM_WORKERS, CPU_THREADS, WHISPER_LANG = "tiny.en", "cpu", "int8", 10, 8, "en"



def initialize_whisper():
    global whisper_model
    if whisper_model is None:
        print(f"Initializing Whisper Model in {os.getpid()}")
        whisper_model = WhisperModel (
            model_size_or_path=MODEL_TYPE,
            device=RUN_TYPE,
            compute_type=COMPUTE_TYPE,
            num_workers=NUM_WORKERS,
            cpu_threads=CPU_THREADS,
            download_root="./models"
        )

thread_executor = ThreadPoolExecutor()
process_executor = ProcessPoolExecutor(max_workers=4, initializer=initialize_whisper)

async def transcribe_audio(audio_buffer):
    """
    Perform transcription using whisper_model in a separate thread.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        thread_executor,
        _transcribe_audio_sync,  # The synchronous method
        audio_buffer
    )

def _transcribe_audio_sync(audio_buffer):
    """
    Synchronous transcription logic for running in a thread.
    """
    print(f"Starting transcription at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
    print(f"After Audio Buffer Type: {type(audio_buffer)} Audio Buffer Shape: {audio_buffer.shape}")
    segments, _ = whisper_model.transcribe(audio_buffer, language=WHISPER_LANG)
    segments = [s.text for s in segments]
    transcription = " ".join(segments)
    print(f"Transcription: {transcription}")
    
    # time.sleep(10)

    print(f"Ending   transcription at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")


async def transcribe_audio_process(audio_buffer, queue):
    """
    Perform transcription using whisper_model in a separate process.
    """
    print(f"QUEUE", hex(id(queue)))
    loop = asyncio.get_running_loop()
    data = await loop.run_in_executor(
        process_executor,
        _transcribe_audio_sync_process,
        audio_buffer,
    )

    print(f"Data type: {type(data)}, Data: {data[:10]} Data Length: {len(data)}")


    audio_segment: AudioSegment = AudioSegment.from_file(io.BytesIO(data), format="mp3")
    samples = np.array(audio_segment.get_array_of_samples())
    print(f"ORG AUDIO : Frame Rate: {audio_segment.frame_rate}, Frame Width: {audio_segment.frame_width}, Channels: {audio_segment.channels} Samples: {type(samples)}, {len(samples)} DType: {samples.dtype} ")
    # Frame Rate: 24000, Frame Width: 2, Channels: 1 Samples: <class 'numpy.ndarray'>, 11520

    resampled_audio = audio_segment.set_frame_rate(48000)
    resampled_samples = np.array(resampled_audio.get_array_of_samples())
    print(f"CON AUDIO : Frame Rate: {resampled_audio.frame_rate}, Frame Width: {resampled_audio.frame_width}, Channels: {resampled_audio.channels} Samples: {type(resampled_samples)}, {len(resampled_samples)} DType: {samples.dtype}")
    # Frame Rate: 48000, Frame Width: 2, Channels: 1 Samples: <class 'numpy.ndarray'>, 23039
    
    # Iterate over resampled_samples to create frames of 960 samples
    for i in range(0, len(resampled_samples), 960):
        frame_samples = resampled_samples[i:i + 960]
        if len(frame_samples) < 960:
            # Pad the last frame if it's less than 960 samples
            frame_samples = np.pad(frame_samples, (0, 960 - len(frame_samples)), 'constant')
        
        
        # Convert to AudioFrame
        frame_samples = frame_samples.reshape(-1, 1)
        frame_samples = frame_samples.T
        # print("FRAME: ", frame_samples.shape)

        frame = AudioFrame.from_ndarray(frame_samples, format="s16", layout="mono")
        
        # Add frame to the queue
        await queue.put(frame)

    print("QUEUE PUT DONE")

    return


def _transcribe_audio_sync_process(audio_buffer):
    """
    Synchronous transcription logic for running in a thread.
    """

    global whisper_model
    if not whisper_model:
        raise ValueError("Whisper model not initialized")

    print(f"Starting transcription at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
    print(f"After Audio Buffer Type: {type(audio_buffer)} Audio Buffer Shape: {audio_buffer.shape}")
    segments, _ = whisper_model.transcribe(audio_buffer, language=WHISPER_LANG)
    segments = [s.text for s in segments]
    transcription = " ".join(segments)
    print(f"PID:{os.getpid()} Transcription: {transcription}")
    
    # time.sleep(10)
    print(f"Ending   transcription at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")

    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=transcription,
    )

    filename = f"output{random.randint(1, 1000)}.wav"
    print(f"Response: {response}, response")
    data = response.read()
    # print(f"Data type: {type(data)}, Data: {data[:10]}")
    # f.write(data)

    return data
    



    

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
    endFrameCnt = 0
    concat = False
    audio_data = []
    audio_buffer = []
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad')
    (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils
    _timestamp = 0
    
    def __init__(self, track: AudioStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track
        self.queue = asyncio.Queue()
        initialize_whisper()
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

    async def recv(self):
        frame: AudioFrame = await self.track.recv()
            
        frameNP = frame.to_ndarray()
        # print(f"FrameNP: {frameNP.shape} Format: {frame.format} Samples: {frame.samples} Layout: {frame.layout} Channels: {frame.layout.channels}, TimeStamp: {frame.pts}, Frame SampleRate: {frame.sample_rate}")
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
                            print("QUEUE", hex(id(self.queue)))
                            asyncio.create_task(transcribe_audio_process(self.audio_buffer, self.queue))

                        self.audio_buffer = []
                        self.endFrameCnt = 0 

        else:
            self.audio_data = frameNP
            self.concat = True

        self._timestamp += frame.samples

        if not self.queue.empty():
            voice_frame = await self.queue.get()
            voice_frame.sample_rate = frame.sample_rate
            voice_frame.pts = self._timestamp
            voice_frame.time_base = frame.time_base
            print(f"Voice_frame  = Format: {voice_frame.format} Samples: {voice_frame.samples} Layout: {voice_frame.layout} Channels: {voice_frame.layout.channels}, TimeStamp: {voice_frame.pts}, Frame SampleRate: {voice_frame.sample_rate}, Time Base: {voice_frame.time_base}")
            # Voice_frame  = Format: <av.AudioFormat s16> Samples: 960 Layout: <av.AudioLayout 'mono'> Channels: (<av.AudioChannel 'FC' (front center)>,), TimeStamp: 432000, Frame SampleRate: 48000
            return voice_frame
        
        empty_frame = AudioFrame.from_ndarray(np.zeros((1, frame.samples), dtype="int16"), format="s16", layout="mono")
        empty_frame.sample_rate = frame.sample_rate
        empty_frame.pts = self._timestamp
        empty_frame.time_base = frame.time_base
        # print(f"return_frame = Format: {return_frame.format} Samples: {return_frame.samples} Layout: {return_frame.layout} Channels: {return_frame.layout.channels}, TimeStamp: {return_frame.pts}, Frame SampleRate: {return_frame.sample_rate}")
        # return_frame = Format: <av.AudioFormat s16> Samples: 960 Layout: <av.AudioLayout 'mono'> Channels: (<av.AudioChannel 'FC' (front center)>,), TimeStamp: 167040, Frame SampleRate: 48000
        # print(f"Org_frame    = Format: {frame.format} Samples: {frame.samples} Layout: {frame.layout} Channels: {frame.layout.channels}, TimeStamp: {frame.pts}, Frame SampleRate: {frame.sample_rate}")
        # Org_frame    = Format: <av.AudioFormat s16> Samples: 960 Layout: <av.AudioLayout 'stereo'> Channels: (<av.AudioChannel 'FL' (front left)>, <av.AudioChannel 'FR' (front right)>), TimeStamp: 166080, Frame SampleRate: 48000
        return empty_frame
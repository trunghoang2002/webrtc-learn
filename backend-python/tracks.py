
from aiortc import MediaStreamTrack, AudioStreamTrack, VideoStreamTrack
from av import AudioFrame, VideoFrame
import numpy as np
import torchaudio
import torch

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
    def __init__(self, track: AudioStreamTrack):
        super().__init__()  # don't forget this!
        self.track = track

    async def recv(self):
        frame: AudioFrame = await self.track.recv()
        # self.cnt += 1
        audio_data = frame.to_ndarray()

        print(audio_data)
        if(frame.layout.name == "stereo"):
            audio_data = np.mean(audio_data, axis=0)
        print(audio_data.size)

        print(f"Frame: {frame.sample_rate} Format: {frame.format} Samples: {frame.samples} Layout: {frame.layout.name}",)
        return frame
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import soundfile as sf

# load model and processor
processor = WhisperProcessor.from_pretrained("openai/whisper-large-v2")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v2")
model.config.forced_decoder_ids = None

audio_file_path = './backend/samples/test1.flac'
audio, sampling_rate = sf.read(audio_file_path)

input_features = processor(audio.tolist(), sampling_rate=sampling_rate, return_tensors="pt").input_features 


# generate token ids
predicted_ids = model.generate(input_features)

# decode token ids to text
transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)
print(transcription)
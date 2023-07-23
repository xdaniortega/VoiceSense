# Copyright 2022 Cartesi Pte. Ltd.
#
# SPDX-License-Identifier: Apache-2.0
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use
# this file except in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.

from os import environ
import traceback
import logging
import requests

# NEW 
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import soundfile as sf
import io
from pydub import AudioSegment
import re
import os


#


logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
logger.info(f"HTTP rollup_server url is {rollup_server}")

processor = WhisperProcessor.from_pretrained("openai/whisper-large-v2")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v2")
model.config.forced_decoder_ids = None
output_file_path = "output_audio.webm"
# Ruta donde se guardará el archivo de audio en formato flac
flac_audio_file_path = 'output_audio.flac'

def parse_transaction_input(input_string):
    # Define el patrón de regex para extraer el monto y la dirección del receptor
    # Acepta tanto "Eth" como "Ethereum", y nombres de dominio con múltiples segmentos.
    pattern = r"Send\s+(\d+(\.\d+)?)\s+(Eth|Ethereum|eth|ethereum)\s+to\s+([\w\.]+)"

    # Busca el patrón en el input_string
    match = re.search(pattern, input_string)

    if match:
        # Extrae el monto y la dirección del receptor desde los grupos capturados por el patrón de regex
        amount = float(match.group(1))
        receiver_address = match.group(4)

        return amount, receiver_address
    else:
        raise ValueError("Input inválido")

    

def loadAndProcess(data):
    logger.info("Loading and processing audio")

    # Write the audio data to a file
    with open(output_file_path, "wb") as f:
        f.write(data)



    # Leer el archivo webm
    audio = AudioSegment.from_file(output_file_path, format="webm")
    audio = audio.set_frame_rate(16000)
    # Convertir el audio a formato flac
    audio.export(flac_audio_file_path, format="flac")

    # Use soundfile to read the audio in FLAC format from BytesIO with dtype='int16'
    audio, sampling_rate = sf.read(flac_audio_file_path, dtype='int16')

    # Delete the temporary files
    os.remove(output_file_path)
    os.remove(flac_audio_file_path)

    input_features = processor(audio.tolist(), sampling_rate=sampling_rate, return_tensors="pt").input_features 

    logger.info("Decoding transcription")

    # Generate token ids
    predicted_ids = model.generate(input_features)

    # Decode token ids to text
    transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)
    return transcription

def hex2str(hex):
    """
    Decodes a hex string into a regular string
    """
    return bytes.fromhex(hex[2:]).decode("utf-8")

def str2hex(str):
    """
    Encodes a string as a hex string
    """
    return "0x" + str.encode("utf-8").hex()

def handle_advance(data):

    #logger.info(f"Received advance request data {data}")

    status = "accept"
    try:

        input_bytes = bytes.fromhex(data["payload"][2:])
        
        output = loadAndProcess(input_bytes)
        # Unir las cadenas
        #logger.info(f"List: {processedVoiceAsList}")

        #processedVoicetoString = ''.join(processedVoiceAsList)
        #logger.info(f"something{processedVoicetoString}")
        #logger.info(f"type{type(processedVoicetoString)}")
        #output = parse_transaction_input(processedVoicetoString)
        logger.info(f"Output: {output}")

        # Evaluates expression
        #parser = Parser()
        #output = parser.parse(input).evaluate({})

        # Emits notice with result of calculation
        logger.info(f"Adding notice with payload: '{output}'")
        response = requests.post(rollup_server + "/notice", json={"payload": str2hex(str(output))})
        logger.info(f"Received notice status {response.status_code} body {response.content}")

    except Exception as e:
        status = "reject"
        msg = f"Error processing data {data}\n{traceback.format_exc()}"
        logger.error(msg)
        response = requests.post(rollup_server + "/report", json={"payload": str2hex(msg)})
        logger.info(f"Received report status {response.status_code} body {response.content}")

    return status

def handle_inspect(data):
    logger.info(f"Received inspect request data {data}")
    logger.info("Adding report")
    response = requests.post(rollup_server + "/report", json={"payload": data["payload"]})
    logger.info(f"Received report status {response.status_code}")
    return "accept"

handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

finish = {"status": "accept"}

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])

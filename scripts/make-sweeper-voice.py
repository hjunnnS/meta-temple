"""Local prototype voice, using the previously approved Korean male voice."""
import subprocess as sp, tempfile
with tempfile.TemporaryDirectory() as tmp:
    voice=tmp+'/monk.aiff'
    sp.run(['say','-v','Reed (한국어(한국))','-r','118','-o',voice,'나무 [[slnc 180]] 관세음보살.'],check=True)
    duration=sp.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',voice],text=True).strip()
    assert duration and 1<float(duration)<4.1, 'Local speech output is empty or too long; check macOS voice access.'
    sp.run(['ffmpeg','-v','error','-y','-i',voice,'-af','highpass=f=65,lowpass=f=7800,equalizer=f=190:t=q:w=0.85:g=1.5,aecho=0.8:0.6:65:0.10,loudnorm=I=-18:TP=-2:LRA=7','-ar','24000','-ac','1','-c:a','libmp3lame','-q:a','4','public/ceremonies/monk-greeting.mp3'],check=True)

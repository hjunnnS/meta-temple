import subprocess as sp,tempfile,sys

reflection = """우리의 마음은 때로 잔잔한 호수와 같고, 때로는 거센 바람이 부는 바다와 같습니다.

하지만 바람이 분다고 해서 호수의 본래 모습이 사라지는 것은 아닙니다.

오늘 하루 마음을 어지럽혔던 걱정이 있다면, 잠시 내려놓아 보십시오.

지금 이 순간, 숨을 고르고 자신의 마음을 바라보는 것부터 시작해 보십시오."""
clips={
'moktak':'목탁 소리에 맞추어 두 손을 모읍니다. 숨을 천천히 내쉬며 몸과 마음을 가다듬습니다.',
'chant':reflection,
'palms':'두 손바닥을 가볍게 맞대고 고개를 숙입니다. 모든 이가 오늘 평안하기를 바랍니다.',
'wish':'오늘 이 자리에서 바라는 마음 하나를 떠올려 봅니다. 나와 이웃이 함께 평안하기를 발원합니다.',
'bow':'숨을 내쉬며 천천히 예를 올립니다. 앉은 자리에서 편안하게 합장으로 함께해도 좋습니다.',
'bell':'저녁 예불을 알리는 범종입니다. 종의 여운이 사라질 때까지 잠시 귀를 기울입니다.'}
with tempfile.TemporaryDirectory() as tmp:
 for key,words in clips.items():
  if sys.argv[1:] and key not in sys.argv[1:]:continue
  voice=tmp+'/voice.aiff'
  if key == 'chant':
   # Preserve Korean phrase contours. Give each reflection a little breathing room.
   spoken = ' [[slnc 850]] '.join(words.split('\n\n'))
   sp.run(['say','-v','Reed (한국어(한국))','-r','138','-o',voice,spoken],check=True)
  else:
   sp.run(['say','-v','Yuna','-r','145','-o',voice,words],check=True)
  dur=float(sp.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',voice]))
  assert dur>2
  length=60 if key == 'chant' else 30
  assert dur+1<length, f"{key}: narration exceeds loop duration"
  print(key,dur,flush=True)
  args=['ffmpeg','-v','error','-y','-i',voice]
  if key in ['bell','moktak','chant']:
   bell=key=='bell'
   freq,decay,cycle=(145,0.7,8) if bell else (510,17,2)
   age=f'mod(t,{cycle})'
   expr=f'0.16*min(1,200*{age})*exp(-{decay}*{age})*(sin(2*PI*{freq}*t)+0.35*sin(2*PI*{freq*2.4}*t))'
   mix='[0:a]adelay=800,apad[a];[a][1:a]amix=duration=shortest:normalize=0'
   if key=='chant':
    # A short wooden attack and a lower resonant body, beneath the voice.
    age='mod(t,2.5)'
    expr=f'min(1,290*{age})*(0.105*exp(-19*{age})*sin(2*PI*440*t)+0.055*exp(-42*{age})*sin(2*PI*720*t)+0.026*exp(-95*{age})*sin(2*PI*1210*t))'
    mix='[0:a]highpass=f=65,lowpass=f=7800,equalizer=f=190:t=q:w=0.85:g=1.5,adelay=750,apad[a];[a][1:a]amix=duration=shortest:normalize=0,alimiter=limit=0.93:level=0'
   args+=['-f','lavfi','-i',f"aevalsrc='{expr}':s=24000:d={length}",'-filter_complex',mix]
  else: args+=['-af','adelay=400,apad']
  # For the longer reflection periods, leave time to contemplate after the guidance.
  args+=['-t',str(length),'-ar','24000','-ac','1','-c:a','libmp3lame','-q:a','6',f'public/ceremonies/{key}.mp3']
  sp.run(args,check=True)

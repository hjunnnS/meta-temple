import {faces,type Face} from './face-types';
import {locale} from './locales';
import type {Locale} from './locales/languages';
import './face-picker.css';

const icons=['👤','🐭','🐮','🐯','🐰','🐲','🐍','🐴','🐑','🐵','🐔','🐶','🐷'];
const labels:Record<Locale,string>={
 ko:'얼굴 선택|사람|쥐|소|호랑이|토끼|용|뱀|말|양|원숭이|닭|개|돼지',
 en:'Choose a face|Human|Rat|Ox|Tiger|Rabbit|Dragon|Snake|Horse|Sheep|Monkey|Rooster|Dog|Pig',
 ja:'顔を選ぶ|人間|ネズミ|ウシ|トラ|ウサギ|竜|ヘビ|ウマ|ヒツジ|サル|ニワトリ|イヌ|イノシシ',
 'zh-Hans':'选择面孔|人|鼠|牛|虎|兔|龙|蛇|马|羊|猴|鸡|狗|猪',
 'pt-PT':'Escolher rosto|Pessoa|Rato|Boi|Tigre|Coelho|Dragão|Serpente|Cavalo|Ovelha|Macaco|Galo|Cão|Porco',
 'pt-BR':'Escolher rosto|Pessoa|Rato|Boi|Tigre|Coelho|Dragão|Cobra|Cavalo|Ovelha|Macaco|Galo|Cachorro|Porco',
 es:'Elegir rostro|Persona|Rata|Buey|Tigre|Conejo|Dragón|Serpiente|Caballo|Oveja|Mono|Gallo|Perro|Cerdo',
 fr:'Choisir un visage|Humain|Rat|Bœuf|Tigre|Lapin|Dragon|Serpent|Cheval|Mouton|Singe|Coq|Chien|Cochon',
 it:'Scegli il volto|Persona|Topo|Bue|Tigre|Coniglio|Drago|Serpente|Cavallo|Pecora|Scimmia|Gallo|Cane|Maiale',
 ms:'Pilih wajah|Manusia|Tikus|Lembu|Harimau|Arnab|Naga|Ular|Kuda|Biri-biri|Monyet|Ayam jantan|Anjing|Babi',
 de:'Gesicht wählen|Mensch|Ratte|Ochse|Tiger|Hase|Drache|Schlange|Pferd|Schaf|Affe|Hahn|Hund|Schwein',
 vi:'Chọn khuôn mặt|Người|Chuột|Bò|Hổ|Thỏ|Rồng|Rắn|Ngựa|Cừu|Khỉ|Gà trống|Chó|Lợn',
 ru:'Выбрать лицо|Человек|Крыса|Бык|Тигр|Кролик|Дракон|Змея|Лошадь|Овца|Обезьяна|Петух|Собака|Свинья',
 tr:'Yüz seç|İnsan|Fare|Öküz|Kaplan|Tavşan|Ejderha|Yılan|At|Koyun|Maymun|Horoz|Köpek|Domuz'
};
export function facePicker(container:HTMLElement,apply:(face:Face)=>void){
 const button=document.createElement('button'),dialog=document.createElement('dialog');
 const [title,...names]=labels[locale].split('|');
 button.type='button';button.textContent=icons[1];button.id='face-picker';button.title=title;
 button.setAttribute('aria-label',title);button.setAttribute('aria-haspopup','dialog');container.append(button);
 dialog.className='face-dialog';dialog.setAttribute('aria-label',title);
 const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button');
 heading.textContent=title;close.textContent='×';close.setAttribute('aria-label',({ko:'닫기',en:'Close'} as Record<string,string>)[locale]??'×');
 close.onclick=()=>dialog.close();header.append(heading,close);
 const grid=document.createElement('div');grid.className='face-grid';
 let selected:Face='human';
 for(const [i,face] of faces.entries()){
  const option=document.createElement('button'),icon=document.createElement('span');
  icon.textContent=icons[i];icon.setAttribute('aria-hidden','true');option.append(icon,names[i]);option.dataset.face=face;
  option.setAttribute('aria-pressed',String(face===selected));grid.append(option);
  option.onclick=()=>{
   apply(face);selected=face;
   for(const item of grid.children)item.setAttribute('aria-pressed',String((item as HTMLElement).dataset.face===face));
   dialog.close();
  };
 }
 dialog.append(header,grid);document.body.append(dialog);
 button.onclick=()=>{dialog.showModal();grid.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus();};
}

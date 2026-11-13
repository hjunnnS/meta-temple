# -*- coding: utf-8 -*-
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
keys=['잠시 여운을 느껴 보세요.','천천히 숨을 들이쉬세요.','천천히 숨을 내쉬세요.','합장하고 있습니다.','무릎을 꿇고 있습니다.','절을 올리고 있습니다.','몸을 일으키고 있습니다.','배치 마치기','상품과 기간 보기','시험 상품','선택 가능','선택한 자리','밝은 테두리의 자리를 선택하세요.']
rows={
'en':'Take a moment to rest.|Breathe in slowly.|Breathe out slowly.|Bringing palms together.|Kneeling down.|Bowing.|Rising gently.|Finish arranging|View items and durations|Trial item|Available|Selected place|Choose a place with a bright border.',
'ja':'少し余韻を感じてみましょう。|ゆっくり息を吸いましょう。|ゆっくり息を吐きましょう。|合掌しています。|膝をついています。|礼拝しています。|ゆっくり立ち上がっています。|配置を終える|商品と期間を見る|体験用商品|選択できます|選んだ場所|明るい枠の場所を選んでください。',
'zh-Hans':'请稍作停留，感受余韵。|请缓缓吸气。|请缓缓呼气。|正在合掌。|正在跪下。|正在礼拜。|正在缓缓起身。|完成布置|查看物品与时长|体验物品|可选择|已选位置|请选择边框明亮的位置。',
'es':'Tómate un momento de calma.|Inhala lentamente.|Exhala lentamente.|Juntando las palmas.|Arrodillándose.|Haciendo una reverencia.|Levantándose suavemente.|Terminar de colocar|Ver artículos y duración|Artículo de prueba|Disponible|Lugar elegido|Elige un lugar con borde claro.',
'fr':'Prenez un instant de calme.|Inspirez lentement.|Expirez lentement.|Les paumes se joignent.|À genoux.|En prosternation.|Le corps se relève doucement.|Terminer la disposition|Voir les objets et durées|Objet d’essai|Disponible|Emplacement choisi|Choisissez un emplacement au contour clair.',
'it':'Concediti un momento di calma.|Inspira lentamente.|Espira lentamente.|Unendo i palmi.|Inginocchiandosi.|In prostrazione.|Rialzandosi dolcemente.|Termina la disposizione|Vedi oggetti e durate|Oggetto di prova|Disponibile|Posto scelto|Scegli un posto con il bordo chiaro.',
'de':'Nimm dir einen Moment der Ruhe.|Atme langsam ein.|Atme langsam aus.|Die Handflächen werden zusammengelegt.|In die Knie gehen.|Verbeugung.|Langsam aufrichten.|Anordnen beenden|Objekte und Laufzeiten ansehen|Testobjekt|Verfügbar|Gewählter Platz|Wähle einen Platz mit hellem Rand.',
'pt-PT':'Fica um momento em serenidade.|Inspira devagar.|Expira devagar.|A juntar as palmas das mãos.|A ajoelhar.|A fazer uma reverência.|A levantar suavemente.|Terminar a disposição|Ver objetos e durações|Objeto de teste|Disponível|Lugar escolhido|Escolhe um lugar com contorno claro.',
'pt-BR':'Reserve um momento de calma.|Inspire devagar.|Expire devagar.|Unindo as palmas das mãos.|Ajoelhando-se.|Fazendo uma reverência.|Levantando-se suavemente.|Concluir a disposição|Ver itens e durações|Item de teste|Disponível|Lugar escolhido|Escolha um lugar com borda clara.',
'ms':'Luangkan seketika dalam ketenangan.|Tarik nafas perlahan-lahan.|Hembus nafas perlahan-lahan.|Merapatkan kedua-dua tapak tangan.|Berlutut.|Bersujud.|Bangun dengan perlahan.|Selesai menyusun|Lihat item dan tempoh|Item percubaan|Tersedia|Tempat dipilih|Pilih tempat dengan bingkai cerah.',
'vi':'Hãy dành một chút thời gian tĩnh lặng.|Từ từ hít vào.|Từ từ thở ra.|Đang chắp tay.|Đang quỳ xuống.|Đang lễ bái.|Đang nhẹ nhàng đứng dậy.|Hoàn tất bố trí|Xem vật phẩm và thời hạn|Vật phẩm thử nghiệm|Có thể chọn|Vị trí đã chọn|Chọn vị trí có viền sáng.',
'ru':'Побудьте немного в тишине.|Медленно вдохните.|Медленно выдохните.|Ладони складываются вместе.|Опускаемся на колени.|Совершаем поклон.|Плавно поднимаемся.|Завершить размещение|Предметы и сроки|Пробный предмет|Доступно|Выбранное место|Выберите место со светлой рамкой.',
'tr':'Bir an huzur içinde kalın.|Yavaşça nefes alın.|Yavaşça nefes verin.|Avuçlar birleştiriliyor.|Diz çökülüyor.|Secde ediliyor.|Yavaşça doğrulunuyor.|Yerleştirmeyi bitir|Öğeler ve süreleri görüntüle|Deneme öğesi|Seçilebilir|Seçilen yer|Açık renk çerçeveli bir yer seçin.',
}
for locale,row in rows.items():
 values=row.split('|');assert len(keys)==len(values),locale
 p=root/'src/locales'/f'{locale}.json';d=json.loads(p.read_text());d.update(zip(keys,values));p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(root/'docs/m6-translation-keys.json').write_text(json.dumps(keys+['모신 분','연등·소원패 신청이나 산책은 안내를 마친 뒤 자유롭게 선택할 수 있어요.'],ensure_ascii=False,indent=2)+'\n')

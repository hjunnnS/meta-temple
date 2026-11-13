# -*- coding: utf-8 -*-
from pathlib import Path
import json
rows={}
rows['ko']='''어떻게 머물고 싶으신가요?
자유롭게 둘러보거나 스님의 안내를 받을 수 있어요.
스님 안내
오늘 어떤 마음으로 오셨나요?
건강
가족
시험
관계
상실
자유롭게 둘러보기
스님에게 안내받기
완료
건너뜀
선택 전
목적지
지도에서 목적지 보기
기도문과 함께 참배하기
짧게 절하기
천천히 합장하고 절을 올려 보세요.
108배를 마치거나 건너뛰기를 선택할 수 있어요.
천천히 숨을 고르세요. 잠시 머문 뒤 수행 마치기를 눌러 주세요.
연등 신청 알아보기
자유롭게 머무르기
다음 안내
이 단계 건너뛰기
이전 안내
다시 듣기
다른 고민 선택
안내 종료
수행 자리에 도착했어요.
약 {distance}m 남았어요.
아바타로 걸어서 이동해 주세요.
참배
수행
연등
잠시 마음 준비하기
불단 앞 수행 자리로 걸어가기
원하는 수행 선택하기
원한다면 연등에 마음 담기
마음을 돌보는 시간을 가지셨습니다
현재 언어는 자막으로 안내합니다.
안내 다시 보기
편한 자세로 숨을 고르고, 오늘 마음에 담아 온 분을 떠올려 보세요.
{place}의 열린 입구로 들어가 불단 앞 수행 자리로 와 주세요. 사찰 지도에서 현재 목적지를 확인할 수 있습니다.
편한 마음으로 합장하고 절을 올려 보세요. 절이 어렵다면 기도문을 읽으며 잠시 머무른 뒤 건너뛰어도 괜찮습니다.
짧게 절하거나 잠시 명상할 수 있습니다. 108배는 로그인 후 선택할 수 있어요. 지금은 쉬고 싶다면 다음 단계로 건너뛰어도 괜찮습니다.
연등은 선택입니다. 신청을 원하면 배치도에서 자리를 고르고, 예약할 때 로그인해 주세요. 구매하지 않아도 이 안내를 마칠 수 있습니다.
잠시 마음을 돌보는 시간을 가지셨습니다. 이제 자유롭게 머물다 가세요. 같은 고민으로 다시 안내받거나 다른 길을 천천히 둘러보셔도 좋습니다.
몸과 마음의 평안을 바라는 마음으로 약사전을 찾아가 보겠습니다.
가족을 떠올리며 관음전에서 서로를 돌보는 마음을 살펴보겠습니다.
문수전에서 배움의 마음을 가다듬고 지금 할 수 있는 일을 돌아보겠습니다.
보현전에서 나의 말과 행동을 돌아보며 관계를 위한 작은 실천을 생각해 보겠습니다.
지장전에서 그리운 마음을 잠시 내려놓고 소중한 인연을 떠올려 보겠습니다.
몸과 마음이 평안하고, 힘든 시간을 지나가는 동안 용기를 잃지 않기를 바랍니다.
우리 가족이 서로의 마음을 듣고, 따뜻한 말과 행동으로 함께하기를 바랍니다.
배운 것을 차분히 살피고, 준비한 만큼 힘을 다하며, 결과 앞에서도 마음을 지킬 수 있기를 바랍니다.
상대의 마음을 헤아리고, 내 마음도 돌보며, 할 수 있는 작은 친절을 실천하기를 바랍니다.
소중한 인연이 평안하기를 바랍니다. 남겨진 마음도 천천히 돌보고, 기억 속 따뜻함을 간직할 수 있기를 바랍니다.'''
rows['en']='''How would you like to spend your visit?
Explore freely or receive guidance from a monk.
Monk's guidance
What brings you here today?
Health
Family
Exams
Relationships
Loss
Explore freely
Receive guidance
Completed
Skipped
Not chosen
Destination
Show destination on map
Pray and bow with the prayer
Make a short bow
Gently join your palms and bow.
You may finish 108 bows or skip this step.
Breathe slowly. Stay a while, then choose Finish practice.
Learn about lantern offerings
Stay at ease
Next guidance
Skip this step
Previous guidance
Listen again
Choose another concern
End guidance
You have reached the practice place.
About {distance} m to go.
Walk there with your avatar.
Prayer
Practice
Lantern
Take a moment to settle
Walk to the practice place before the altar
Choose a practice
Offer a lantern if you wish
You have taken time to care for your heart
Guidance in this language is provided through captions.
Read the guidance again
Sit or stand comfortably, breathe gently, and think of the person you hold in your heart today.
Enter {place} through the open doorway and approach the practice place before the altar. The temple map shows your destination.
Join your palms and bow at your own pace. If bowing is difficult, read the prayer, stay a moment, and skip this step if you wish.
Make a short bow or meditate for a while. You can choose 108 bows after signing in. You may also rest and skip this step.
A lantern offering is optional. Choose a spot on the plan and sign in when reserving it. You can finish this guidance without buying anything.
You have taken a moment to care for your heart. Stay freely now, repeat the guidance, or slowly explore another path.
Let us visit the Medicine Buddha Hall with a wish for peace of body and mind.
Let us visit Avalokiteshvara Hall and reflect on caring for one another in our family.
Let us settle our mind for learning in Manjushri Hall and reflect on what we can do now.
Let us reflect on our words and actions in Samantabhadra Hall and consider a small act of kindness.
Let us visit Ksitigarbha Hall, make room for grief, and remember a precious connection.
May body and mind be peaceful, and may I not lose courage while passing through difficult times.
May our family listen to one another and share warmth through words and actions.
May I calmly reflect on what I have learned, do my best, and care for my heart whatever the result.
May I understand another's heart, care for my own, and put small acts of kindness into practice.
May the person I cherish be at peace. May I gently care for my grieving heart and keep the warmth of our memories.'''
rows['ja']='''どのように過ごされますか？
自由に散策するか、お坊さんの案内を受けられます。
お坊さんの案内
今日はどのような思いで来られましたか？
健康
家族
試験
人間関係
喪失
自由に散策する
案内を受ける
完了
スキップ
未選択
目的地
地図で目的地を見る
祈りの言葉とともに参拝する
短く礼拝する
ゆっくり合掌して礼拝しましょう。
108拝を終えるか、この段階をスキップできます。
ゆっくり呼吸してください。しばらく過ごしたら「修行を終える」を押してください。
提灯の奉納について見る
自由に過ごす
次の案内
この段階をスキップ
前の案内
もう一度聞く
別の悩みを選ぶ
案内を終える
修行の場所に着きました。
あと約{distance}mです。
アバターで歩いて移動してください。
参拝
修行
提灯
心を落ち着ける
仏壇前の修行の場所へ歩く
修行を選ぶ
希望すれば提灯に思いを込める
心をいたわる時間を過ごしました
この言語では字幕でご案内します。
案内を読み直す
楽な姿勢で呼吸を整え、今日心に思う方を思い浮かべてください。
{place}の開いた入口から入り、仏壇前の修行の場所へお越しください。目的地は寺院の地図で確認できます。
無理のないペースで合掌して礼拝してください。難しい場合は祈りの言葉を読み、少し過ごしてからスキップしても大丈夫です。
短い礼拝や瞑想を選べます。108拝はログイン後に選択できます。休みたいときはスキップしても大丈夫です。
提灯の奉納は任意です。希望する場合は配置図で場所を選び、予約時にログインしてください。購入せずに案内を終えられます。
心をいたわる時間を過ごしました。ここからは自由に過ごし、再び案内を受けたり、別の道をゆっくり歩いたりしてください。
心身の安らぎを願い、薬師殿を訪ねましょう。
家族を思い、観音殿で互いをいたわる心を見つめましょう。
文殊殿で学ぶ心を整え、今できることを振り返りましょう。
普賢殿で自分の言葉や行いを振り返り、小さな親切を考えましょう。
地蔵殿で悲しみにそっと場所を空け、大切な縁を思い出しましょう。
心身が安らかであり、困難な時間の中でも勇気を失いませんように。
家族が互いの心に耳を傾け、温かな言葉と行いで寄り添えますように。
学んだことを落ち着いて振り返り、力を尽くし、結果にかかわらず心を大切にできますように。
相手の心を思いやり、自分の心もいたわり、小さな親切を実践できますように。
大切な方が安らかでありますように。残された心をゆっくりいたわり、記憶の温かさを大切にできますように。'''
rows['zh-Hans']='''您想如何度过这次来访？
可以自由参观，也可以接受僧人的引导。
僧人引导
今天您带着怎样的心情而来？
健康
家人
考试
人际关系
失落
自由参观
接受引导
已完成
已跳过
尚未选择
目的地
在地图上查看目的地
随祈愿文礼拜
简短礼拜
请缓缓合掌、礼拜。
您可以完成108拜，也可以跳过此步。
请缓缓呼吸。停留片刻后，选择“结束修行”。
了解供灯
自由停留
下一步引导
跳过此步
上一步引导
再次聆听
选择其他烦恼
结束引导
您已到达修行位置。
大约还需{distance}米。
请操控角色步行前往。
礼拜
修行
灯笼
先让心安定下来
步行前往佛坛前的修行位置
选择修行方式
如愿意，可供灯寄托心意
您为照顾自己的心留出了时间
当前语言通过字幕提供引导。
重新阅读引导
以舒适的姿势调整呼吸，想一想今天心中牵挂的人。
请从{place}敞开的入口进入，来到佛坛前的修行位置。可以在寺院地图上查看目的地。
请按照自己的节奏合掌礼拜。如不便礼拜，可阅读祈愿文、停留片刻，也可以跳过此步。
可以简短礼拜或静坐片刻。登录后可选择108拜。如果现在想休息，也可以跳过此步。
供灯完全自愿。如有需要，请在布局图上选择位置，预约时再登录。不购买任何物品也能完成引导。
您为照顾自己的心留出了片刻。现在可以自由停留，再次接受引导，或慢慢探索另一条路。
让我们怀着身心安宁的愿望，前往药师殿。
让我们想起家人，在观音殿体会相互关怀的心意。
让我们在文殊殿安定求学的心，回顾当下能够做的事。
让我们在普贤殿反思自己的言行，思考一个小小的善行。
让我们在地藏殿安放思念与悲伤，想起珍贵的缘分。
愿身心安宁，在经历困难的时光中也不失去勇气。
愿家人相互倾听，以温暖的言语和行动彼此陪伴。
愿我平静回顾所学、尽力而为，无论结果如何都能照顾自己的心。
愿我体谅他人的心，也照顾自己的心，并实践力所能及的小小善意。
愿珍贵的故人安宁。愿我慢慢照顾留下的悲伤，并珍藏记忆中的温暖。'''

rows['es']='''¿Cómo te gustaría pasar tu visita?
Puedes explorar libremente o recibir la guía de un monje.
Guía del monje
¿Qué te trae aquí hoy?
Salud
Familia
Exámenes
Relaciones
Pérdida
Explorar libremente
Recibir orientación
Completado
Omitido
Sin elegir
Destino
Ver el destino en el mapa
Rezar y hacer una reverencia
Hacer una reverencia breve
Junta las palmas y haz una reverencia con calma.
Puedes completar las 108 reverencias u omitir este paso.
Respira despacio. Quédate un momento y luego elige Terminar práctica.
Información sobre ofrendar una linterna
Quedarse libremente
Siguiente indicación
Omitir este paso
Indicación anterior
Escuchar de nuevo
Elegir otra preocupación
Terminar la guía
Has llegado al lugar de práctica.
Quedan unos {distance} m.
Camina hasta allí con tu avatar.
Oración
Práctica
Linterna
Preparar el corazón
Caminar al lugar de práctica ante el altar
Elegir una práctica
Ofrendar una linterna si lo deseas
Has dedicado tiempo a cuidar tu corazón
La guía en este idioma se ofrece con subtítulos.
Volver a leer la guía
Adopta una postura cómoda, respira con suavidad y piensa en la persona que llevas hoy en el corazón.
Entra en {place} por la puerta abierta y acércate al lugar de práctica ante el altar. El mapa del templo muestra el destino.
Junta las palmas y haz una reverencia a tu ritmo. Si te resulta difícil, lee la oración, quédate un momento y omite este paso si lo deseas.
Puedes hacer una breve reverencia o meditar un rato. Las 108 reverencias requieren iniciar sesión. También puedes descansar y omitir este paso.
Ofrendar una linterna es opcional. Elige un lugar en el plano e inicia sesión al reservarlo. Puedes completar la guía sin comprar nada.
Has dedicado un momento a cuidar tu corazón. Ahora puedes quedarte libremente, repetir la guía o explorar otro camino con calma.
Visitemos el Pabellón del Buda de la Medicina con un deseo de paz para el cuerpo y la mente.
Recordemos a nuestra familia en el Pabellón de Avalokiteshvara y reflexionemos sobre cómo cuidarnos mutuamente.
Serenemos la mente para aprender en el Pabellón de Manjushri y pensemos en lo que podemos hacer ahora.
Reflexionemos sobre nuestras palabras y acciones en el Pabellón de Samantabhadra y pensemos en un pequeño gesto amable.
Visitemos el Pabellón de Ksitigarbha, dando espacio al duelo y recordando un vínculo querido.
Que el cuerpo y la mente estén en paz, y que no pierda el valor al atravesar momentos difíciles.
Que nuestra familia se escuche y se acompañe con palabras y acciones cálidas.
Que repase con calma lo aprendido, dé lo mejor de mí y cuide mi corazón cualquiera que sea el resultado.
Que comprenda el corazón ajeno, cuide el mío y practique pequeños actos de bondad.
Que la persona que quiero esté en paz. Que cuide con ternura mi duelo y conserve la calidez de nuestros recuerdos.'''
rows['fr']='''Comment souhaitez-vous vivre cette visite ?
Explorez librement ou laissez-vous guider par un moine.
Guide du moine
Qu'est-ce qui vous amène aujourd'hui ?
Santé
Famille
Examens
Relations
Deuil et perte
Explorer librement
Être guidé
Terminé
Passé
Non choisi
Destination
Voir la destination sur la carte
Prier et se prosterner
Faire une courte prosternation
Joignez doucement les mains et prosternez-vous.
Vous pouvez terminer les 108 prosternations ou passer cette étape.
Respirez lentement. Restez un moment, puis choisissez Terminer la pratique.
Découvrir l'offrande d'une lanterne
Rester librement
Indication suivante
Passer cette étape
Indication précédente
Réécouter
Choisir une autre préoccupation
Terminer le guide
Vous êtes arrivé à l'emplacement de pratique.
Il reste environ {distance} m.
Allez-y à pied avec votre avatar.
Prière
Pratique
Lanterne
Prendre un instant pour se recueillir
Marcher jusqu'à l'emplacement devant l'autel
Choisir une pratique
Offrir une lanterne si vous le souhaitez
Vous avez pris le temps de prendre soin de votre cœur
Dans cette langue, le guide est présenté en sous-titres.
Relire le guide
Adoptez une posture confortable, respirez doucement et pensez à la personne que vous portez dans votre cœur aujourd'hui.
Entrez dans {place} par la porte ouverte et approchez de l'emplacement devant l'autel. La carte du temple indique la destination.
Joignez les mains et prosternez-vous à votre rythme. Si cela est difficile, lisez la prière, restez un instant ou passez cette étape.
Vous pouvez faire une courte prosternation ou méditer. Les 108 prosternations sont proposées après connexion. Vous pouvez aussi vous reposer et passer.
L'offrande d'une lanterne est facultative. Choisissez un emplacement sur le plan et connectez-vous lors de la réservation. Vous pouvez finir le guide sans achat.
Vous avez pris un instant pour prendre soin de votre cœur. Restez librement, reprenez le guide ou découvrez tranquillement un autre chemin.
Visitons le pavillon du Bouddha de médecine avec un souhait de paix du corps et de l'esprit.
Pensons à notre famille au pavillon d'Avalokiteshvara et à la manière de prendre soin les uns des autres.
Au pavillon de Manjushri, apaisons notre esprit pour apprendre et réfléchissons à ce que nous pouvons faire maintenant.
Au pavillon de Samantabhadra, réfléchissons à nos paroles, à nos actes et à un petit geste de bonté.
Au pavillon de Ksitigarbha, faisons une place au chagrin et souvenons-nous d'un lien précieux.
Puissent mon corps et mon esprit être en paix, et puissé-je garder courage dans les moments difficiles.
Puisse notre famille s'écouter et se soutenir par des paroles et des gestes chaleureux.
Puissé-je revoir calmement ce que j'ai appris, faire de mon mieux et prendre soin de mon cœur quel que soit le résultat.
Puissé-je comprendre le cœur d'autrui, prendre soin du mien et accomplir de petits gestes de bonté.
Puisse la personne qui m'est chère être en paix. Puissé-je accueillir doucement mon deuil et conserver la chaleur de nos souvenirs.'''
rows['it']='''Come desideri trascorrere la visita?
Esplora liberamente oppure ricevi la guida di un monaco.
Guida del monaco
Che cosa ti porta qui oggi?
Salute
Famiglia
Esami
Relazioni
Perdita
Esplora liberamente
Ricevi una guida
Completato
Saltato
Non scelto
Destinazione
Mostra la destinazione sulla mappa
Prega e inchinati con la preghiera
Fai un breve inchino
Unisci dolcemente le mani e inchinati.
Puoi completare i 108 inchini o saltare questo passaggio.
Respira lentamente. Rimani un momento e poi scegli Termina pratica.
Scopri l'offerta di una lanterna
Rimani liberamente
Guida successiva
Salta questo passaggio
Guida precedente
Ascolta di nuovo
Scegli un'altra preoccupazione
Termina la guida
Hai raggiunto il luogo della pratica.
Mancano circa {distance} m.
Raggiungilo a piedi con il tuo avatar.
Preghiera
Pratica
Lanterna
Prepara il cuore con calma
Cammina fino al luogo davanti all'altare
Scegli una pratica
Offri una lanterna, se lo desideri
Hai dedicato del tempo alla cura del tuo cuore
In questa lingua la guida è disponibile con i sottotitoli.
Rileggi la guida
Assumi una posizione comoda, respira dolcemente e pensa alla persona che porti nel cuore oggi.
Entra in {place} dalla porta aperta e avvicinati al luogo davanti all'altare. La mappa del tempio mostra la destinazione.
Unisci le mani e inchinati con i tuoi tempi. Se è difficile, leggi la preghiera, rimani un momento o salta questo passaggio.
Puoi fare un breve inchino o meditare. I 108 inchini sono disponibili dopo l'accesso. Se preferisci riposare, puoi saltare questo passaggio.
L'offerta di una lanterna è facoltativa. Scegli un posto sulla pianta e accedi al momento della prenotazione. Puoi completare la guida senza acquistare nulla.
Hai dedicato un momento al tuo cuore. Ora rimani liberamente, ripeti la guida o esplora con calma un altro sentiero.
Visitiamo il Padiglione del Buddha della Medicina con un desiderio di pace per corpo e mente.
Pensiamo alla famiglia nel Padiglione di Avalokiteshvara e riflettiamo su come prenderci cura gli uni degli altri.
Nel Padiglione di Manjushri, calmiamo la mente per imparare e riflettiamo su ciò che possiamo fare ora.
Nel Padiglione di Samantabhadra, riflettiamo su parole e azioni e pensiamo a un piccolo gesto gentile.
Nel Padiglione di Ksitigarbha, facciamo spazio al dolore e ricordiamo un legame prezioso.
Che corpo e mente siano in pace e che io non perda il coraggio nei momenti difficili.
Che la nostra famiglia sappia ascoltarsi e accompagnarsi con parole e gesti affettuosi.
Che io ripassi con calma ciò che ho imparato, faccia del mio meglio e protegga il cuore qualunque sia il risultato.
Che io comprenda il cuore altrui, mi prenda cura del mio e compia piccoli atti di gentilezza.
Che la persona a me cara sia in pace. Che io mi prenda cura con dolcezza del mio dolore e custodisca il calore dei ricordi.'''
rows['de']='''Wie möchten Sie Ihren Besuch gestalten?
Erkunden Sie den Tempel frei oder lassen Sie sich von einem Mönch begleiten.
Anleitung des Mönchs
Was führt Sie heute hierher?
Gesundheit
Familie
Prüfungen
Beziehungen
Verlust
Frei erkunden
Anleitung erhalten
Abgeschlossen
Übersprungen
Noch nicht gewählt
Ziel
Ziel auf der Karte zeigen
Mit dem Gebet beten und sich verbeugen
Eine kurze Verbeugung machen
Legen Sie ruhig die Hände zusammen und verbeugen Sie sich.
Sie können 108 Verbeugungen abschließen oder diesen Schritt überspringen.
Atmen Sie langsam. Verweilen Sie kurz und wählen Sie dann Übung beenden.
Informationen zur Laternengabe
Frei verweilen
Nächste Anleitung
Diesen Schritt überspringen
Vorherige Anleitung
Erneut anhören
Ein anderes Anliegen wählen
Anleitung beenden
Sie haben den Übungsplatz erreicht.
Noch etwa {distance} m.
Gehen Sie mit Ihrem Avatar dorthin.
Gebet
Übung
Laterne
Einen Moment zur Ruhe kommen
Zum Übungsplatz vor dem Altar gehen
Eine Übung wählen
Auf Wunsch eine Laterne darbringen
Sie haben sich Zeit für Ihr Herz genommen
In dieser Sprache wird die Anleitung als Untertitel angezeigt.
Anleitung erneut lesen
Nehmen Sie eine bequeme Haltung ein, atmen Sie ruhig und denken Sie an die Person, die Sie heute im Herzen tragen.
Betreten Sie {place} durch den offenen Eingang und gehen Sie zum Übungsplatz vor dem Altar. Die Tempelkarte zeigt das Ziel.
Legen Sie die Hände zusammen und verbeugen Sie sich in Ihrem Tempo. Falls das schwerfällt, lesen Sie das Gebet, verweilen Sie kurz oder überspringen Sie diesen Schritt.
Sie können sich kurz verbeugen oder meditieren. 108 Verbeugungen sind nach der Anmeldung möglich. Sie können sich auch ausruhen und den Schritt überspringen.
Eine Laternengabe ist freiwillig. Wählen Sie einen Platz auf dem Plan und melden Sie sich erst zur Reservierung an. Sie können die Anleitung ohne Kauf abschließen.
Sie haben sich einen Moment für Ihr Herz genommen. Verweilen Sie frei, wiederholen Sie die Anleitung oder erkunden Sie ruhig einen anderen Weg.
Besuchen wir die Halle des Medizin-Buddha mit dem Wunsch nach Frieden für Körper und Geist.
Denken wir in der Avalokiteshvara-Halle an unsere Familie und daran, füreinander zu sorgen.
Kommen wir in der Manjushri-Halle zum Lernen zur Ruhe und betrachten wir, was wir jetzt tun können.
Betrachten wir in der Samantabhadra-Halle unsere Worte und Taten und denken wir an eine kleine freundliche Handlung.
Geben wir in der Ksitigarbha-Halle der Trauer Raum und erinnern wir uns an eine wertvolle Verbindung.
Mögen Körper und Geist friedlich sein, und möge ich in schweren Zeiten den Mut bewahren.
Möge unsere Familie einander zuhören und sich mit warmen Worten und Taten begleiten.
Möge ich ruhig auf das Gelernte schauen, mein Bestes geben und mein Herz unabhängig vom Ergebnis bewahren.
Möge ich andere verstehen, für mein eigenes Herz sorgen und kleine freundliche Taten verwirklichen.
Möge die mir liebe Person in Frieden sein. Möge ich sanft für meine Trauer sorgen und die Wärme unserer Erinnerungen bewahren.'''

rows['pt-PT']='''Como deseja passar a sua visita?
Explore livremente ou receba a orientação de um monge.
Orientação do monge
O que o traz aqui hoje?
Saúde
Família
Exames
Relações
Perda
Explorar livremente
Receber orientação
Concluído
Ignorado
Por escolher
Destino
Ver o destino no mapa
Orar e fazer uma reverência
Fazer uma breve reverência
Junte suavemente as mãos e faça uma reverência.
Pode concluir as 108 reverências ou ignorar esta etapa.
Respire devagar. Permaneça um pouco e escolha Terminar prática.
Conhecer a oferenda de uma lanterna
Permanecer livremente
Próxima orientação
Ignorar esta etapa
Orientação anterior
Ouvir novamente
Escolher outra preocupação
Terminar orientação
Chegou ao local de prática.
Faltam cerca de {distance} m.
Caminhe até lá com o seu avatar.
Oração
Prática
Lanterna
Preparar o coração com calma
Caminhar até ao local diante do altar
Escolher uma prática
Oferecer uma lanterna, se desejar
Dedicou tempo a cuidar do seu coração
Neste idioma, a orientação é apresentada com legendas.
Voltar a ler a orientação
Adote uma posição confortável, respire suavemente e pense na pessoa que traz hoje no coração.
Entre em {place} pela porta aberta e aproxime-se do local diante do altar. O mapa do templo mostra o destino.
Junte as mãos e faça uma reverência ao seu ritmo. Se for difícil, leia a oração, permaneça um pouco ou ignore esta etapa.
Pode fazer uma breve reverência ou meditar. As 108 reverências estão disponíveis após iniciar sessão. Também pode descansar e ignorar esta etapa.
A oferenda de uma lanterna é opcional. Escolha um lugar na planta e inicie sessão ao reservá-lo. Pode concluir a orientação sem comprar nada.
Dedicou um momento ao seu coração. Agora pode permanecer livremente, repetir a orientação ou explorar outro caminho com calma.
Visitemos o Pavilhão do Buda da Medicina com um desejo de paz para o corpo e a mente.
Pensemos na família no Pavilhão de Avalokiteshvara e reflitamos sobre cuidar uns dos outros.
No Pavilhão de Manjushri, acalmemos a mente para aprender e reflitamos sobre o que podemos fazer agora.
No Pavilhão de Samantabhadra, reflitamos sobre as nossas palavras e ações e pensemos num pequeno gesto de bondade.
No Pavilhão de Ksitigarbha, demos espaço ao luto e recordemos uma ligação preciosa.
Que o corpo e a mente estejam em paz e que eu não perca a coragem nos momentos difíceis.
Que a nossa família saiba ouvir-se e acompanhar-se com palavras e ações calorosas.
Que eu reveja com calma o que aprendi, dê o meu melhor e cuide do coração seja qual for o resultado.
Que eu compreenda o coração dos outros, cuide do meu e pratique pequenos gestos de bondade.
Que a pessoa que estimo esteja em paz. Que eu cuide com ternura do meu luto e guarde o calor das nossas memórias.'''
rows['pt-BR']=rows['pt-PT'].replace('Como deseja passar a sua visita?','Como você gostaria de passar a visita?').replace('O que o traz aqui hoje?','O que traz você aqui hoje?').replace('Por escolher','Ainda não escolhido').replace('ao seu ritmo','no seu ritmo').replace('iniciar sessão','fazer login').replace('inicie sessão','faça login').replace('até ao local','até o local').replace('num pequeno','em um pequeno').replace('as nossas palavras','nossas palavras').replace('ao reservá-lo','ao reservar').replace('Chegou ao local de prática.','Você chegou ao local de prática.').replace('Dedicou tempo a cuidar do seu coração','Você dedicou tempo a cuidar do seu coração')
rows['ms']='''Bagaimanakah anda ingin meluangkan masa di sini?
Terokai dengan bebas atau terima panduan seorang sami.
Panduan sami
Apakah yang membawa anda ke sini hari ini?
Kesihatan
Keluarga
Peperiksaan
Hubungan
Kehilangan
Terokai dengan bebas
Terima panduan
Selesai
Dilangkau
Belum dipilih
Destinasi
Lihat destinasi pada peta
Berdoa dan bersujud bersama doa
Bersujud seketika
Rapatkan tapak tangan dan bersujud dengan tenang.
Anda boleh melengkapkan 108 sujud atau melangkau langkah ini.
Bernafas perlahan. Luangkan sedikit masa, kemudian pilih Tamatkan amalan.
Ketahui tentang persembahan tanglung
Luangkan masa dengan bebas
Panduan seterusnya
Langkau langkah ini
Panduan sebelumnya
Dengar semula
Pilih kebimbangan lain
Tamatkan panduan
Anda telah tiba di tempat amalan.
Kira-kira {distance} m lagi.
Berjalan ke sana dengan avatar anda.
Doa
Amalan
Tanglung
Tenangkan hati seketika
Berjalan ke tempat amalan di hadapan altar
Pilih amalan
Persembahkan tanglung jika mahu
Anda telah meluangkan masa menjaga hati
Panduan bahasa ini diberikan melalui sari kata.
Baca panduan semula
Ambil posisi yang selesa, bernafas perlahan dan fikirkan insan yang anda ingati hari ini.
Masuk ke {place} melalui pintu terbuka dan hampiri tempat amalan di hadapan altar. Destinasi ditunjukkan pada peta kuil.
Rapatkan tapak tangan dan bersujud mengikut kemampuan. Jika sukar, baca doa, luangkan sedikit masa atau langkau langkah ini.
Anda boleh bersujud seketika atau bermeditasi. 108 sujud boleh dipilih selepas log masuk. Anda juga boleh berehat dan melangkau langkah ini.
Persembahan tanglung ialah pilihan. Pilih tempat pada pelan dan log masuk semasa membuat tempahan. Anda boleh menamatkan panduan tanpa membeli apa-apa.
Anda telah meluangkan masa menjaga hati. Kini anda boleh tinggal dengan bebas, mengulangi panduan atau meneroka laluan lain dengan tenang.
Mari kunjungi Dewan Buddha Perubatan dengan harapan agar tubuh dan minda tenteram.
Mari ingati keluarga di Dewan Avalokiteshvara dan renungkan cara saling menjaga.
Di Dewan Manjushri, mari tenangkan minda untuk belajar dan renungkan apa yang dapat dilakukan sekarang.
Di Dewan Samantabhadra, mari renungkan kata-kata dan tindakan kita serta satu kebaikan kecil.
Di Dewan Ksitigarbha, mari beri ruang kepada kesedihan dan ingati hubungan yang berharga.
Semoga tubuh dan minda tenteram, dan semoga saya tidak kehilangan keberanian ketika melalui masa sukar.
Semoga keluarga kami saling mendengar dan bersama melalui kata-kata serta tindakan yang penuh kasih.
Semoga saya meneliti apa yang dipelajari dengan tenang, berusaha sebaik mungkin dan menjaga hati tanpa mengira hasilnya.
Semoga saya memahami hati orang lain, menjaga hati sendiri dan melakukan kebaikan kecil yang termampu.
Semoga insan yang saya sayangi tenteram. Semoga saya menjaga kesedihan dengan lembut dan menyimpan kehangatan kenangan kami.'''
rows['vi']='''Bạn muốn trải nghiệm chuyến thăm như thế nào?
Tự do khám phá hoặc nhận sự hướng dẫn của nhà sư.
Nhà sư hướng dẫn
Hôm nay điều gì đưa bạn đến đây?
Sức khỏe
Gia đình
Thi cử
Các mối quan hệ
Mất mát
Tự do khám phá
Nhận hướng dẫn
Đã hoàn thành
Đã bỏ qua
Chưa chọn
Điểm đến
Xem điểm đến trên bản đồ
Cầu nguyện và lễ bái
Lễ bái ngắn
Hãy nhẹ nhàng chắp tay và lễ bái.
Bạn có thể hoàn thành 108 lạy hoặc bỏ qua bước này.
Hãy thở chậm. Ở lại một chút rồi chọn Kết thúc tu tập.
Tìm hiểu việc cúng đèn lồng
Tự do ở lại
Hướng dẫn tiếp theo
Bỏ qua bước này
Hướng dẫn trước
Nghe lại
Chọn nỗi niềm khác
Kết thúc hướng dẫn
Bạn đã đến chỗ tu tập.
Còn khoảng {distance} m.
Hãy điều khiển nhân vật đi bộ đến đó.
Cầu nguyện
Tu tập
Đèn lồng
Lắng tâm trong giây lát
Đi đến chỗ tu tập trước bàn thờ
Chọn cách tu tập
Cúng đèn lồng nếu bạn muốn
Bạn đã dành thời gian chăm sóc tâm mình
Ngôn ngữ này được hướng dẫn bằng phụ đề.
Đọc lại hướng dẫn
Giữ tư thế thoải mái, thở nhẹ nhàng và nghĩ về người bạn đang nhớ đến hôm nay.
Đi qua cửa mở của {place} và đến chỗ tu tập trước bàn thờ. Bạn có thể xem điểm đến trên bản đồ chùa.
Chắp tay và lễ bái theo nhịp độ của mình. Nếu thấy khó, hãy đọc lời nguyện, ở lại một lát hoặc bỏ qua bước này.
Bạn có thể lễ bái ngắn hoặc ngồi thiền. Có thể chọn 108 lạy sau khi đăng nhập. Bạn cũng có thể nghỉ ngơi và bỏ qua bước này.
Cúng đèn lồng là tùy chọn. Chọn vị trí trên sơ đồ và chỉ đăng nhập khi đặt chỗ. Bạn có thể hoàn thành hướng dẫn mà không mua gì.
Bạn đã dành một chút thời gian chăm sóc tâm mình. Giờ hãy tự do ở lại, nghe hướng dẫn lần nữa hoặc thong thả khám phá con đường khác.
Hãy đến điện Dược Sư với tâm nguyện thân tâm an lành.
Hãy nghĩ về gia đình tại điện Quan Âm và suy ngẫm về sự chăm sóc lẫn nhau.
Tại điện Văn Thù, hãy lắng tâm học hỏi và nhìn lại những việc có thể làm lúc này.
Tại điện Phổ Hiền, hãy nhìn lại lời nói, hành động và nghĩ về một việc thiện nhỏ.
Tại điện Địa Tạng, hãy dành chỗ cho nỗi buồn và nhớ về một mối duyên quý giá.
Nguyện cho thân tâm an lành và không đánh mất can đảm khi đi qua những ngày khó khăn.
Nguyện cho gia đình biết lắng nghe nhau và cùng nhau bằng lời nói, hành động ấm áp.
Nguyện cho tôi bình tâm nhìn lại điều đã học, hết sức cố gắng và chăm sóc tâm mình dù kết quả thế nào.
Nguyện cho tôi thấu hiểu lòng người, chăm sóc lòng mình và thực hành những điều tử tế nhỏ trong khả năng.
Nguyện cho người tôi thương được bình an. Nguyện cho tôi nhẹ nhàng chăm sóc nỗi buồn và gìn giữ hơi ấm của ký ức.'''
rows['ru']='''Как вы хотите провести этот визит?
Исследуйте храм свободно или воспользуйтесь помощью монаха.
Проводник-монах
Что привело вас сюда сегодня?
Здоровье
Семья
Экзамены
Отношения
Утрата
Свободная прогулка
Получить наставление
Завершено
Пропущено
Не выбрано
Место назначения
Показать место на карте
Помолиться и совершить поклон
Совершить короткий поклон
Спокойно сложите ладони и поклонитесь.
Вы можете завершить 108 поклонов или пропустить этот шаг.
Дышите медленно. Побудьте немного и выберите «Завершить практику».
Узнать о подношении фонаря
Остаться свободно
Следующее наставление
Пропустить этот шаг
Предыдущее наставление
Послушать ещё раз
Выбрать другое переживание
Завершить наставление
Вы пришли к месту практики.
Осталось около {distance} м.
Идите туда своим персонажем.
Молитва
Практика
Фонарь
Дать сердцу успокоиться
Пройти к месту практики перед алтарём
Выбрать практику
Поднести фонарь по желанию
Вы уделили время заботе о своём сердце
На этом языке наставления представлены субтитрами.
Перечитать наставление
Примите удобную позу, дышите спокойно и подумайте о человеке, которого сегодня храните в сердце.
Войдите в {place} через открытую дверь и подойдите к месту практики перед алтарём. Место назначения отмечено на карте храма.
Сложите ладони и поклонитесь в удобном для вас темпе. Если это трудно, прочтите молитву, побудьте немного или пропустите этот шаг.
Можно совершить короткий поклон или помедитировать. 108 поклонов доступны после входа в аккаунт. Можно также отдохнуть и пропустить шаг.
Подношение фонаря необязательно. Выберите место на схеме и войдите в аккаунт при бронировании. Завершить наставление можно без покупки.
Вы уделили немного времени своему сердцу. Теперь свободно оставайтесь, повторите наставление или спокойно пройдите другим путём.
Посетим зал Будды Медицины с пожеланием мира телу и уму.
Вспомним семью в зале Авалокитешвары и подумаем о заботе друг о друге.
В зале Манджушри успокоим ум для учёбы и подумаем о том, что можем сделать сейчас.
В зале Самантабхадры подумаем о своих словах и поступках и о небольшом добром деле.
В зале Кшитигарбхи дадим место скорби и вспомним дорогую связь.
Пусть тело и ум будут спокойны, и пусть я сохраняю мужество в трудные времена.
Пусть наша семья слышит друг друга и поддерживает тёплыми словами и поступками.
Пусть я спокойно осмыслю изученное, приложу все силы и сохраню душевное равновесие при любом результате.
Пусть я понимаю чувства другого, забочусь о своём сердце и совершаю посильные добрые дела.
Пусть дорогой мне человек будет в мире. Пусть я мягко позабочусь о своей скорби и сохраню тепло воспоминаний.'''
rows['tr']='''Ziyaretinizi nasıl geçirmek istersiniz?
Özgürce keşfedebilir veya bir keşişten rehberlik alabilirsiniz.
Keşişin rehberliği
Bugün sizi buraya ne getirdi?
Sağlık
Aile
Sınavlar
İlişkiler
Kayıp
Özgürce keşfet
Rehberlik al
Tamamlandı
Atlandı
Seçilmedi
Hedef
Hedefi haritada göster
Dua ederek eğil
Kısa bir eğilme yap
Avuçlarınızı yavaşça birleştirip eğilin.
108 eğilmeyi tamamlayabilir veya bu adımı atlayabilirsiniz.
Yavaşça nefes alın. Biraz kalın, ardından Uygulamayı bitir seçeneğine basın.
Fener sunusu hakkında bilgi
Özgürce kal
Sonraki rehberlik
Bu adımı atla
Önceki rehberlik
Tekrar dinle
Başka bir kaygı seç
Rehberliği bitir
Uygulama yerine ulaştınız.
Yaklaşık {distance} m kaldı.
Avatarınızla yürüyerek gidin.
Dua
Uygulama
Fener
Kalbi bir an sakinleştir
Sunağın önündeki uygulama yerine yürü
Bir uygulama seç
Dilerseniz bir fener sunun
Kalbinize özen göstermek için zaman ayırdınız
Bu dilde rehberlik altyazıyla sunulur.
Rehberliği yeniden oku
Rahat bir duruş alın, sakince nefes alın ve bugün kalbinizde taşıdığınız kişiyi düşünün.
{place} yapısının açık kapısından girip sunağın önündeki uygulama yerine yaklaşın. Hedefinizi tapınak haritasında görebilirsiniz.
Avuçlarınızı birleştirip kendi hızınızda eğilin. Zor gelirse duayı okuyabilir, biraz kalabilir veya bu adımı atlayabilirsiniz.
Kısa bir eğilme yapabilir ya da meditasyon yapabilirsiniz. Giriş yaptıktan sonra 108 eğilme seçilebilir. Dinlenip bu adımı atlamak da mümkündür.
Fener sunusu isteğe bağlıdır. Plandan bir yer seçin ve rezervasyon sırasında giriş yapın. Hiçbir şey satın almadan rehberliği tamamlayabilirsiniz.
Kalbinize özen göstermek için bir an ayırdınız. Şimdi özgürce kalabilir, rehberliği tekrarlayabilir veya başka bir yolu sakince keşfedebilirsiniz.
Beden ve zihnin huzuru dileğiyle Şifa Budası Salonu'nu ziyaret edelim.
Avalokiteshvara Salonu'nda ailemizi düşünelim ve birbirimize özen göstermeyi hatırlayalım.
Manjushri Salonu'nda öğrenmek için zihnimizi sakinleştirip şu anda yapabileceklerimizi düşünelim.
Samantabhadra Salonu'nda söz ve davranışlarımızı gözden geçirip küçük bir iyilik düşünelim.
Kshitigarbha Salonu'nda yasımıza yer açıp değerli bir bağı hatırlayalım.
Bedenim ve zihnim huzurlu olsun; zor zamanlardan geçerken cesaretimi kaybetmeyeyim.
Ailemiz birbirini dinlesin, sıcak sözler ve davranışlarla birlikte olsun.
Öğrendiklerimi sakince gözden geçireyim, elimden geleni yapayım ve sonuç ne olursa olsun kalbime özen göstereyim.
Başkalarının kalbini anlayayım, kendi kalbime de özen göstereyim ve yapabildiğim küçük iyilikleri uygulayayım.
Sevdiğim kişi huzur içinde olsun. Yasımı şefkatle taşıyıp anılarımızın sıcaklığını koruyabileyim.'''

meditation_hints={
'ko':'천천히 숨을 고르세요. 10초 이상 머문 뒤 수행 마치기를 눌러 주세요.',
'en':'Breathe slowly. Stay for at least 10 seconds, then choose Finish practice.',
'ja':'ゆっくり呼吸してください。10秒以上過ごしたら「修行を終える」を押してください。',
'zh-Hans':'请缓缓呼吸。停留至少10秒后，选择“结束修行”。',
'es':'Respira despacio. Quédate al menos 10 segundos y luego elige Terminar práctica.',
'fr':'Respirez lentement. Restez au moins 10 secondes, puis choisissez Terminer la pratique.',
'it':'Respira lentamente. Rimani almeno 10 secondi e poi scegli Termina pratica.',
'de':'Atmen Sie langsam. Verweilen Sie mindestens 10 Sekunden und wählen Sie dann Übung beenden.',
'pt-PT':'Respire devagar. Permaneça pelo menos 10 segundos e escolha Terminar prática.',
'pt-BR':'Respire devagar. Fique por pelo menos 10 segundos e escolha Terminar prática.',
'ms':'Bernafas perlahan. Luangkan sekurang-kurangnya 10 saat, kemudian pilih Tamatkan amalan.',
'vi':'Hãy thở chậm. Ở lại ít nhất 10 giây rồi chọn Kết thúc tu tập.',
'ru':'Дышите медленно. Побудьте не менее 10 секунд и выберите «Завершить практику».',
'tr':'Yavaşça nefes alın. En az 10 saniye kalın, ardından Uygulamayı bitir seçeneğine basın.'}
for lang,value in meditation_hints.items():
 parts=rows[lang].splitlines();parts[20]=value;rows[lang]='\n'.join(parts)

if __name__=='__main__':
 root=Path(__file__).resolve().parents[1]
 keys=rows['ko'].splitlines()
 assert len(rows)==14,(len(rows),list(rows))
 assert len(keys)==58
 for lang,text in rows.items():
  values=text.splitlines();assert len(values)==len(keys),(lang,len(values))
  if lang=='ko':continue
  assert all(not any('\uac00'<=c<='\ud7a3'for c in v)for v in values),lang
  for k,v in zip(keys,values):
   for token in ['{place}','{distance}']:assert (token in k)==(token in v),(lang,k,token)
  file=root/'src/locales'/(lang+'.json');data=json.loads(file.read_text());data.pop('천천히 숨을 고르세요. 잠시 머문 뒤 수행 마치기를 눌러 주세요.',None);data.update(dict(zip(keys,values)));file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (root/'docs/m5-guide-translation-keys.json').write_text(json.dumps(keys,ensure_ascii=False,indent=2)+'\n')
 print('Applied',len(keys),'guide keys to',len(rows)-1,'foreign locale packs; Korean uses source strings')

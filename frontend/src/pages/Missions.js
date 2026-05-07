import React, { useState, useEffect, useRef } from 'react';
import { 
  FiTarget, FiMic, FiMicOff, FiVolume2, FiSend, FiArrowLeft, 
  FiCheck, FiX, FiStar, FiMapPin, FiCoffee, FiHome, FiBriefcase,
  FiShoppingCart, FiTruck, FiUsers, FiHeart, FiAward
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { missionsAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Missions.css';

// Mission scenarios for different languages
const missionScenarios = {
  restaurant: {
    id: 'restaurant',
    name: 'Order Food',
    icon: <FiCoffee />,
    description: 'Order a meal at a restaurant',
    xpReward: 30,
    difficulty: 'Easy',
    color: '#e74c3c',
    roles: { user: 'Customer', ai: 'Waiter' },
    objectives: [
      'Greet the waiter',
      'Ask for the menu',
      'Order a main dish',
      'Order a drink',
      'Ask for the bill'
    ],
    prompts: {
      English: {
        greeting: "Welcome to our restaurant! How can I help you today?",
        responses: [
          "Hello! Welcome. Would you like to see the menu?",
          "Of course! Here is our menu: Main dishes - pasta, grilled chicken, fish, burger, and salad. What main dish would you like to order?",
          "Great choice! We have water, soda, juice, and coffee. What would you like to drink?",
          "Perfect! Would you like anything else, or should I bring the bill?",
          "Of course! Your total will be $25. Cash or card?"
        ]
      },
      Spanish: {
        greeting: "¡Bienvenido a nuestro restaurante! ¿En qué puedo ayudarle?",
        responses: [
          "¡Hola! Bienvenido. ¿Le gustaría ver el menú?",
          "¡Claro! Aquí está el menú: Platos principales - pasta, pollo a la parrilla, pescado, hamburguesa y ensalada. ¿Qué plato principal le gustaría pedir?",
          "¡Buena elección! Tenemos agua, refresco, jugo y café. ¿Qué desea beber?",
          "¡Perfecto! ¿Desea algo más o le traigo la cuenta?",
          "¡Claro! Su total es 25 euros. ¿Efectivo o tarjeta?"
        ]
      },
      German: {
        greeting: "Willkommen in unserem Restaurant! Wie kann ich Ihnen helfen?",
        responses: [
          "Hallo! Willkommen. Möchten Sie die Speisekarte sehen?",
          "Natürlich! Hier ist die Speisekarte: Hauptgerichte - Pasta, gegrilltes Hähnchen, Fisch, Burger und Salat. Welches Hauptgericht möchten Sie bestellen?",
          "Gute Wahl! Wir haben Wasser, Limonade, Saft und Kaffee. Was möchten Sie trinken?",
          "Perfekt! Möchten Sie noch etwas oder soll ich die Rechnung bringen?",
          "Selbstverständlich! Ihre Rechnung beträgt 25 Euro. Bar oder Karte?"
        ]
      },
      French: {
        greeting: "Bienvenue dans notre restaurant ! Comment puis-je vous aider ?",
        responses: [
          "Bonjour ! Bienvenue. Voulez-vous voir le menu ?",
          "Bien sûr ! Voici le menu : Plats principaux - pâtes, poulet grillé, poisson, burger et salade. Quel plat principal souhaitez-vous commander ?",
          "Excellent choix ! Nous avons de l'eau, du soda, du jus et du café. Que souhaitez-vous boire ?",
          "Parfait ! Voulez-vous autre chose ou dois-je apporter l'addition ?",
          "Bien sûr ! Votre total est de 25 euros. Espèces ou carte ?"
        ]
      },
      Hindi: {
        greeting: "हमारे रेस्टोरेंट में आपका स्वागत है! मैं आपकी क्या मदद कर सकता हूं?",
        responses: [
          "नमस्ते! स्वागत है। क्या आप मेन्यू देखना चाहेंगे?",
          "ज़रूर! यह हमारा मेन्यू है: मुख्य भोजन - पास्ता, ग्रिल्ड चिकन, फिश, बर्गर और सलाद। आप कौन सा मुख्य भोजन ऑर्डर करना चाहेंगे?",
          "बढ़िया चुनाव! हमारे पास पानी, सोडा, जूस और कॉफी है। आप क्या पीना चाहेंगे?",
          "ठीक है! क्या कुछ और चाहिए या मैं बिल लेकर आऊं?",
          "जी हां! आपका टोटल 500 रुपये है। कैश या कार्ड?"
        ]
      },
      Japanese: {
        greeting: "いらっしゃいませ！何をご注文されますか？",
        responses: [
          "こんにちは！ようこそ。メニューをご覧になりますか？",
          "もちろんです！メニューはこちらです：メイン料理 - パスタ、グリルチキン、魚、バーガー、サラダ。メイン料理は何にしますか？",
          "よい選択です。お水、ソーダ、ジュース、コーヒーがあります。何を飲みますか？",
          "承知しました。他にご注文はありますか？それともお会計にしますか？",
          "はい！合計は2500円です。現金かカードですか？"
        ]
      }
    }
  },
  hotel: {
    id: 'hotel',
    name: 'Book a Hotel',
    icon: <FiHome />,
    description: 'Book a room at a hotel',
    xpReward: 35,
    difficulty: 'Medium',
    color: '#3498db',
    roles: { user: 'Guest', ai: 'Receptionist' },
    objectives: [
      'Greet the receptionist',
      'Ask about room availability',
      'Specify check-in/out dates',
      'Ask about amenities',
      'Confirm booking'
    ],
    prompts: {
      English: {
        greeting: "Good evening! Welcome to Grand Hotel. How may I assist you?",
        responses: [
          "Hello and welcome! I would be happy to help with your stay today.",
          "Yes, we have both single and double rooms available. What are your check-in and check-out dates?",
          "Great, those dates work. Would you like to know what amenities are included?",
          "Our rooms include WiFi, breakfast, and gym access.",
          "Excellent! Your booking is confirmed. Here's your room key. Enjoy your stay!"
        ]
      },
      Spanish: {
        greeting: "¡Buenas noches! Bienvenido al Gran Hotel. ¿En qué puedo ayudarle?",
        responses: [
          "¡Hola y bienvenido! Con gusto le ayudo con su estancia hoy.",
          "Sí, tenemos habitaciones individuales y dobles disponibles. ¿Cuáles son sus fechas de entrada y salida?",
          "¡Perfecto! Esas fechas están disponibles. ¿Desea saber qué servicios incluye la habitación?",
          "Nuestras habitaciones incluyen WiFi, desayuno y gimnasio.",
          "¡Excelente! Su reserva está confirmada. Aquí tiene su llave. ¡Disfrute su estancia!"
        ]
      },
      German: {
        greeting: "Guten Abend! Willkommen im Grand Hotel. Wie kann ich Ihnen helfen?",
        responses: [
          "Hallo und willkommen! Ich helfe Ihnen gern mit Ihrem Aufenthalt.",
          "Ja, wir haben Einzel- und Doppelzimmer verfügbar. Was sind Ihre Check-in- und Check-out-Daten?",
          "Perfekt, diese Daten sind verfugbar. Mochten Sie die enthaltenen Annehmlichkeiten kennen?",
          "Unsere Zimmer beinhalten WLAN, Fruhstuck und Fitnessstudio.",
          "Ausgezeichnet! Ihre Buchung ist bestätigt. Hier ist Ihr Zimmerschlüssel. Genießen Sie Ihren Aufenthalt!"
        ]
      },
      French: {
        greeting: "Bonsoir ! Bienvenue au Grand Hôtel. Comment puis-je vous aider ?",
        responses: [
          "Bonjour et bienvenue ! Je serai ravi de vous aider pour votre séjour.",
          "Oui, nous avons des chambres simples et doubles disponibles. Quelles sont vos dates d'arrivée et de départ ?",
          "Parfait, ces dates sont disponibles. Voulez-vous connaître les services inclus ?",
          "Nos chambres comprennent le WiFi, le petit-déjeuner et l'accès à la salle de sport.",
          "Excellent ! Votre réservation est confirmée. Voici votre clé. Bon séjour !"
        ]
      },
      Hindi: {
        greeting: "शुभ संध्या! ग्रैंड होटल में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूं?",
        responses: [
          "नमस्ते और स्वागत है! मैं आज आपकी स्टे में खुशी से मदद करूंगा।",
          "जी हां, हमारे पास सिंगल और डबल दोनों रूम उपलब्ध हैं। आपकी चेक-इन और चेक-आउट तारीखें क्या हैं?",
          "बहुत अच्छा, उन तारीखों में रूम उपलब्ध है। क्या आप सुविधाओं के बारे में जानना चाहेंगे?",
          "हमारे कमरों में वाईफाई, नाश्ता और जिम एक्सेस शामिल है।",
          "बहुत बढ़िया! आपकी बुकिंग कन्फर्म हो गई है। यह रहा आपका रूम की। अपने प्रवास का आनंद लें!"
        ]
      },
      Japanese: {
        greeting: "こんばんは！グランドホテルへようこそ。いかがなさいますか？",
        responses: [
          "ようこそ！本日のご滞在について喜んでご案内します。",
          "はい、シングルルームとダブルルームの空きがございます。チェックインとチェックアウトの日程を教えてください。",
          "ありがとうございます。その日程でご案内できます。設備の内容をご案内しましょうか？",
          "客室にはWiFi、朝食、ジム利用が含まれています。",
          "ありがとうございます！ご予約が確定しました。ルームキーをどうぞ。ごゆっくりどうぞ！"
        ]
      }
    }
  },
  directions: {
    id: 'directions',
    name: 'Ask Directions',
    icon: <FiMapPin />,
    description: 'Ask for directions on the street',
    xpReward: 25,
    difficulty: 'Easy',
    color: '#2ecc71',
    roles: { user: 'Tourist', ai: 'Local Person' },
    objectives: [
      'Get attention politely',
      'Ask about a location',
      'Understand the directions',
      'Confirm understanding',
      'Thank the person'
    ],
    prompts: {
      English: {
        greeting: "Hello! You look a bit lost. Can I help you find something?",
        responses: [
          "Sure — what place are you trying to find? For example: the train station, a hotel, the museum, the airport, or the city center.",
          "Sure! Go straight for two blocks, then turn left.",
          "Keep going and look for a big landmark building. It should be nearby.",
          "Yes, that's correct. If you get confused, you can ask someone again.",
          "You're welcome! Have a nice day!"
        ]
      },
      Spanish: {
        greeting: "¡Hola! Parece que está un poco perdido. ¿Puedo ayudarle?",
        responses: [
          "¡Claro! ¿A qué lugar quiere ir? Por ejemplo: la estación de tren, un hotel, el museo, el aeropuerto o el centro de la ciudad.",
          "¡Claro! Siga recto dos calles y luego gire a la izquierda.",
          "Siga caminando y busque un edificio grande como referencia. Está cerca.",
          "Sí, es correcto. Si se confunde, puede preguntar de nuevo.",
          "¡De nada! ¡Que tenga un buen día!"
        ]
      },
      German: {
        greeting: "Hallo! Sie sehen etwas verloren aus. Kann ich Ihnen helfen?",
        responses: [
          "Natürlich! Wohin möchten Sie gehen? Zum Beispiel: zum Bahnhof, zu einem Hotel, zum Museum, zum Flughafen oder ins Stadtzentrum.",
          "Gern! Gehen Sie zwei Straßen geradeaus und biegen Sie dann links ab.",
          "Gehen Sie weiter und achten Sie auf ein großes Gebäude als Orientierung. Es ist in der Nähe.",
          "Ja, das stimmt so. Wenn Sie unsicher sind, können Sie noch einmal nachfragen.",
          "Gern geschehen! Schönen Tag noch!"
        ]
      },
      French: {
        greeting: "Bonjour ! Vous semblez un peu perdu. Puis-je vous aider ?",
        responses: [
          "Bien sûr ! Quel endroit cherchez-vous ? Par exemple : la gare, un hôtel, le musée, l'aéroport ou le centre-ville.",
          "Bien sûr ! Allez tout droit pendant deux rues, puis tournez à gauche.",
          "Continuez et cherchez un grand bâtiment comme repère. C'est tout près.",
          "Oui, c'est ça. Si vous êtes perdu, vous pouvez redemander.",
          "De rien ! Bonne journée !"
        ]
      },
      Hindi: {
        greeting: "नमस्ते! लगता है आप रास्ता खोज रहे हैं। क्या मैं मदद कर सकता हूं?",
        responses: [
          "ज़रूर! आप किस जगह जाना चाहते हैं? जैसे: रेलवे स्टेशन, होटल, संग्रहालय, हवाई अड्डा, या सिटी सेंटर।",
          "ठीक है! दो ब्लॉक सीधे जाएं, फिर बाएं मुड़ें।",
          "आगे जाकर किसी बड़ी इमारत/लैंडमार्क को देखें। जगह पास में ही होगी।",
          "हाँ, सही है। अगर कन्फ्यूज़ हो जाएँ तो किसी से फिर पूछ सकते हैं।",
          "कोई बात नहीं! आपका दिन शुभ हो!"
        ]
      },
      Japanese: {
        greeting: "こんにちは！道に迷っているようですね。お手伝いしましょうか？",
        responses: [
          "もちろんです。どちらへ行きたいですか？例えば、駅、ホテル、博物館、空港、市内中心部などです。",
          "かしこまりました。2ブロック直進して、左に曲がってください。",
          "そのまま進んで、大きな建物などの目印を探してください。近くにあります。",
          "はい、その理解で合っています。迷ったら、もう一度誰かに聞いてみてください。",
          "どういたしまして！良い一日を！"
        ]
      }
    }
  },
  interview: {
    id: 'interview',
    name: 'Job Interview',
    icon: <FiBriefcase />,
    description: 'Practice a job interview',
    xpReward: 40,
    difficulty: 'Hard',
    color: '#9b59b6',
    roles: { user: 'Candidate', ai: 'Interviewer' },
    objectives: [
      'Introduce yourself',
      'Describe your experience',
      'Explain your skills',
      'Ask about the position',
      'Thank the interviewer'
    ],
    prompts: {
      English: {
        greeting: "Good morning! Please have a seat. Tell me about yourself.",
        responses: [
          "Interesting! What experience do you have related to this position?",
          "Great! What are your main strengths and skills?",
          "Do you have any questions about the role or our company?",
          "Great question. The role focuses on teamwork and problem-solving. Is there anything else you'd like to ask?",
          "Thank you for coming in today. We'll be in touch soon!"
        ]
      },
      Spanish: {
        greeting: "¡Buenos días! Por favor, siéntese. Hábleme de usted.",
        responses: [
          "¡Interesante! ¿Qué experiencia tiene relacionada con este puesto?",
          "¡Muy bien! ¿Cuáles son sus principales fortalezas y habilidades?",
          "¿Tiene alguna pregunta sobre el puesto o nuestra empresa?",
          "Buena pregunta. El puesto se centra en el trabajo en equipo y la resolución de problemas. ¿Alguna otra pregunta?",
          "Gracias por venir hoy. ¡Nos pondremos en contacto pronto!"
        ]
      },
      German: {
        greeting: "Guten Morgen! Bitte nehmen Sie Platz. Erzählen Sie mir von sich.",
        responses: [
          "Interessant! Welche Erfahrung haben Sie für diese Position?",
          "Sehr gut! Was sind Ihre wichtigsten Stärken und Fähigkeiten?",
          "Haben Sie Fragen zur Stelle oder zu unserem Unternehmen?",
          "Gute Frage. Die Stelle erfordert Teamarbeit und Problemlösung. Haben Sie noch weitere Fragen?",
          "Vielen Dank für Ihr Kommen. Wir melden uns bald!"
        ]
      },
      French: {
        greeting: "Bonjour ! Veuillez vous asseoir. Parlez-moi de vous.",
        responses: [
          "Intéressant ! Quelle expérience avez-vous pour ce poste ?",
          "Très bien ! Quels sont vos principaux atouts et compétences ?",
          "Avez-vous des questions sur le poste ou notre entreprise ?",
          "Bonne question. Le poste demande du travail d'équipe et de la résolution de problèmes. Avez-vous d'autres questions ?",
          "Merci d'être venu. Nous vous contacterons bientôt !"
        ]
      },
      Hindi: {
        greeting: "सुप्रभात! कृपया बैठिए। अपने बारे में बताइए।",
        responses: [
          "दिलचस्प! इस पद से संबंधित आपका क्या अनुभव है?",
          "बहुत अच्छा! आपकी मुख्य ताकत और कौशल क्या हैं?",
          "क्या आपके कोई सवाल हैं इस पद या हमारी कंपनी के बारे में?",
          "अच्छा सवाल है। यह भूमिका टीमवर्क और समस्या-समाधान पर केंद्रित है। क्या आपके और कोई सवाल हैं?",
          "आज आने के लिए धन्यवाद। हम जल्द ही संपर्क करेंगे!"
        ]
      },
      Japanese: {
        greeting: "おはようございます！おかけください。自己紹介をお願いします。",
        responses: [
          "興味深いですね！このポジションに関連する経験は何ですか？",
          "素晴らしい！あなたの主な強みとスキルは何ですか？",
          "この仕事や会社について質問はありますか？",
          "良い質問です。この役割はチームワークと問題解決が中心です。他に質問はありますか？",
          "本日はお越しいただきありがとうございました。近日中にご連絡いたします！"
        ]
      }
    }
  },
  shopping: {
    id: 'shopping',
    name: 'Go Shopping',
    icon: <FiShoppingCart />,
    description: 'Buy items at a store',
    xpReward: 30,
    difficulty: 'Easy',
    color: '#f39c12',
    roles: { user: 'Customer', ai: 'Shopkeeper' },
    objectives: [
      'Enter and greet',
      'Ask about a product',
      'Ask about price',
      'Negotiate or confirm',
      'Complete purchase'
    ],
    prompts: {
      English: {
        greeting: "Welcome to our store! What are you looking for today?",
        responses: [
          "Hello! Sure — what product are you looking for?",
          "We have many options! This one is very popular. Would you like to see it?",
          "This one costs $50. We also have a sale - 20% off today!",
          "Would you like me to wrap it for you?",
          "Here's your receipt. Thank you for shopping with us!"
        ]
      },
      Spanish: {
        greeting: "¡Bienvenido a nuestra tienda! ¿Qué busca hoy?",
        responses: [
          "¡Hola! Claro, ¿qué producto está buscando?",
          "¡Tenemos muchas opciones! Este es muy popular. ¿Le gustaría verlo?",
          "Este cuesta 50 euros. También tenemos oferta - ¡20% de descuento hoy!",
          "¿Le gustaría que se lo envolviera?",
          "Aquí tiene su recibo. ¡Gracias por comprar con nosotros!"
        ]
      },
      German: {
        greeting: "Willkommen in unserem Geschäft! Was suchen Sie heute?",
        responses: [
          "Hallo! Natürlich — welches Produkt suchen Sie?",
          "Wir haben viele Optionen! Dieses hier ist sehr beliebt. Möchten Sie es sehen?",
          "Dieses kostet 50 Euro. Wir haben auch einen Rabatt - heute 20% Ermäßigung!",
          "Soll ich es für Sie einpacken?",
          "Hier ist Ihre Quittung. Danke für Ihren Einkauf!"
        ]
      },
      French: {
        greeting: "Bienvenue dans notre magasin ! Que cherchez-vous aujourd'hui ?",
        responses: [
          "Bonjour ! Bien sûr — quel produit cherchez-vous ?",
          "Nous avons beaucoup d'options ! Celui-ci est très populaire. Voulez-vous le voir ?",
          "Celui-ci coûte 50 euros. Nous avons aussi une promotion - 20% de réduction aujourd'hui !",
          "Voulez-vous que je l'emballe ?",
          "Voici votre reçu. Merci de votre achat !"
        ]
      },
      Hindi: {
        greeting: "हमारी दुकान में आपका स्वागत है! आज आप क्या ढूंढ रहे हैं?",
        responses: [
          "नमस्ते! ज़रूर — आप कौन सा प्रोडक्ट ढूंढ रहे हैं?",
          "हमारे पास बहुत विकल्प हैं! यह बहुत लोकप्रिय है। क्या आप इसे देखना चाहेंगे?",
          "इसकी कीमत 500 रुपये है। आज 20% की छूट भी है!",
          "क्या मैं इसे पैक कर दूं?",
          "यह रहा आपका बिल। हमसे खरीदारी के लिए धन्यवाद!"
        ]
      },
      Japanese: {
        greeting: "いらっしゃいませ！今日は何をお探しですか？",
        responses: [
          "こんにちは！もちろんです。どの商品をお探しですか？",
          "たくさんありますよ！これは人気です。ご覧になりますか？",
          "これは5000円です。今日は20%オフのセール中です！",
          "プレゼント用にお包みしますか？",
          "こちらがレシートです。ご来店ありがとうございました！"
        ]
      }
    }
  },
  taxi: {
    id: 'taxi',
    name: 'Take a Taxi',
    icon: <FiTruck />,
    description: 'Get a taxi and go somewhere',
    xpReward: 25,
    difficulty: 'Easy',
    color: '#1abc9c',
    roles: { user: 'Passenger', ai: 'Taxi Driver' },
    objectives: [
      'Hail the taxi',
      'Tell destination',
      'Ask about fare',
      'Small talk during ride',
      'Pay and thank'
    ],
    prompts: {
      English: {
        greeting: "You see a taxi. Hail the driver politely (for example: ‘Hello, taxi!’).",
        responses: [
          "Hi! Where would you like to go? You can say: airport, train station, hotel, city center, hospital, mall, museum, or a restaurant.",
          "Got it! That's about 15 minutes from here. Let's go!",
          "The fare will be around $20. Is that okay?",
          "So, are you visiting or do you live here?",
          "Here we are! That'll be $18.",
          "Thank you! Have a nice day!"
        ]
      },
      Spanish: {
        greeting: "Ves un taxi. Llámalo de forma educada (por ejemplo: «¡Hola, taxi!»).",
        responses: [
          "¡Hola! ¿A dónde le gustaría ir?",
          "¡Entendido! Está a unos 15 minutos de aquí. ¡Vamos!",
          "La tarifa será de unos 20 euros. ¿Está bien?",
          "Entonces, ¿está de visita o vive aquí?",
          "¡Hemos llegado! Son 18 euros.",
          "¡Gracias! ¡Que tenga un buen día!"
        ]
      },
      German: {
        greeting: "Sie sehen ein Taxi. Rufen Sie es höflich (z. B.: „Hallo, Taxi!“).",
        responses: [
          "Hallo! Wohin möchten Sie fahren?",
          "Verstanden! Das ist etwa 15 Minuten von hier. Los geht's!",
          "Die Fahrt kostet ungefähr 20 Euro. Ist das in Ordnung?",
          "Sind Sie zu Besuch hier oder wohnen Sie hier?",
          "Da sind wir! Das macht 18 Euro.",
          "Danke! Schönen Tag noch!"
        ]
      },
      French: {
        greeting: "Vous voyez un taxi. Interpellez-le poliment (par ex. « Bonjour, taxi ! »).",
        responses: [
          "Bonjour ! Où voulez-vous aller ?",
          "Compris ! C'est à environ 15 minutes d'ici. Allons-y !",
          "Le tarif sera d'environ 20 euros. Ça vous va ?",
          "Alors, vous êtes en visite ou vous habitez ici ?",
          "Nous y sommes ! Ce sera 18 euros.",
          "Merci ! Bonne journée !"
        ]
      },
      Hindi: {
        greeting: "आपको एक टैक्सी दिखती है। ड्राइवर को विनम्रता से रोकें (उदाहरण: ‘नमस्ते, टैक्सी!’)।",
        responses: [
          "नमस्ते! आपको कहां जाना है?",
          "समझ गया! यहां से करीब 15 मिनट की दूरी है। चलते हैं!",
          "किराया करीब 200 रुपये होगा। ठीक है?",
          "तो, आप यहां घूमने आए हैं या यहीं रहते हैं?",
          "पहुंच गए! 180 रुपये होंगे।",
          "धन्यवाद! आपका दिन शुभ हो!"
        ]
      },
      Japanese: {
        greeting: "タクシーを見つけました。丁寧に呼び止めてください（例：「こんにちは、タクシー！」）。",
        responses: [
          "こんにちは！どちらまで行かれますか？",
          "わかりました！ここから約15分です。出発しましょう！",
          "料金は約2000円になります。よろしいですか？",
          "観光ですか？それともこちらにお住まいですか？",
          "着きました！1800円になります。",
          "ありがとうございます！良い一日を！"
        ]
      }
    }
  }
};

const normalizeMissionText = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const tokenizeMissionText = (text) => normalizeMissionText(text).split(' ').filter(Boolean);

const detectTaxiDestination = (message) => {
  const text = normalizeMissionText(message);

  // Don't treat fare/payment/small-talk messages as destinations.
  if (includesAny(text, ['fare', 'cost', 'price', 'how much', 'meter', 'charge'])) return null;
  if (includesAny(text, ['thank you', 'thanks', 'payment', 'pay', 'cash', 'card', 'receipt', 'keep the change'])) return null;
  if (includesAny(text, ['weather', 'traffic', 'where are you from', 'visiting', 'live here'])) return null;

  const known = [
    { label: 'the airport', words: ['airport'] },
    { label: 'the train station', words: ['train station', 'railway station', 'station'] },
    { label: 'the bus station', words: ['bus station'] },
    { label: 'the bus stop', words: ['bus stop'] },
    { label: 'a hotel', words: ['hotel'] },
    { label: 'the city center', words: ['city center', 'centre', 'downtown', 'town center', 'center'] },
    { label: 'the hospital', words: ['hospital'] },
    { label: 'the museum', words: ['museum'] },
    { label: 'the restaurant', words: ['restaurant', 'cafe', 'café'] },
    { label: 'the mall', words: ['mall', 'shopping mall'] },
    { label: 'the office', words: ['office'] },
    { label: 'home', words: ['home', 'my home', 'my house'] },
  ];

  const found = known.find(({ words }) => words.some((w) => text.includes(w)));
  if (found) return found.label;

  // Extract a free-form destination (e.g., "Paris", "New York", "central park").
  const patterns = [
    /\b(?:take me to|drop me at|drop me off at|go to|going to|head to|heading to|get to|to)\s+([\p{L}\p{N}][\p{L}\p{N}\s]{1,40})/u,
    /\b(?:go|going|head|heading)\s+([\p{L}\p{N}][\p{L}\p{N}\s]{1,40})/u,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/\b(please|pls|now|today)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned) return cleaned;
    }
  }

  // If the user sends a short place name only ("paris" / "new york"), accept it.
  const words = tokenizeMissionText(text);
  if (words.length >= 1 && words.length <= 3 && !includesAny(text, ['hello', 'hi', 'taxi', 'cab', 'driver', 'please'])) {
    const dest = words.join(' ');
    if (dest.length >= 3) return dest;
  }

  return null;
};

const detectShoppingProduct = (message) => {
  const text = normalizeMissionText(message);

  const products = [
    { label: 'dress', words: ['dress', 'dresses', 'gown'] },
    { label: 'shirt', words: ['shirt', 'shirts', 't shirt', 'tshirt', 'tee'] },
    { label: 'shoes', words: ['shoe', 'shoes', 'sneakers', 'trainers', 'boots'] },
    { label: 'jeans', words: ['jeans', 'denim'] },
    { label: 'jacket', words: ['jacket', 'coat'] },
    { label: 'bag', words: ['bag', 'handbag', 'purse', 'backpack'] },
    { label: 'watch', words: ['watch', 'watches'] },
    { label: 'phone', words: ['phone', 'mobile', 'smartphone'] },
  ];

  const found = products.find(({ words }) => words.some((w) => text.includes(w)));
  if (found) {
    return found.label;
  }

  // Only guess a product name when the user is explicitly asking for something.
  const hasProductRequest = includesAny(text, [
    'looking for',
    'i am looking for',
    'do you have',
    'have you got',
    'can i get',
    'can i have',
    'can i see',
    'show me',
    'i want',
    'i need',
    'need a',
    'want a',
  ]);

  if (hasProductRequest) {
    const words = tokenizeMissionText(text);
    const stopWords = new Set([
      'a', 'an', 'the', 'this', 'that', 'these', 'those',
      'i', 'im', 'me', 'my', 'we', 'you', 'm', 'am',
      'want', 'need', 'looking', 'for', 'have', 'got', 'do', 'does', 'can', 'get', 'see', 'show', 'like', 'would',
      'please', 'thanks', 'thank', 'ok', 'okay', 'yes', 'no',
    ]);

    const meaningfulWords = words
      .filter((w) => !stopWords.has(w))
      .filter((w) => w.length >= 2);

    if (meaningfulWords.length >= 1) {
      // Keep it short and readable.
      return meaningfulWords.slice(-3).join(' ');
    }
  }

  return null;
};

const objectiveMatchers = {
  greet: (text) => includesAny(text, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste', 'hola', 'bonjour', 'hallo']),
  menu: (text) => includesAny(text, [
    'menu', 'food menu', 'show me the menu', 'can i see the menu', 'what is on the menu',
    // Spanish / German / French / Hindi / Japanese
    'menú', 'menu por favor', 'la carta', 'carta',
    'speisekarte',
    'carte', 'la carte',
    'मेन्यू', 'मेनू',
    'メニュー',
  ]),
  mainDish: (text) => includesAny(text, [
    'i want', 'i would like', 'i ll have', 'order', 'main dish',
    // English dish words
    'pasta', 'steak', 'fish', 'chicken', 'burger', 'pizza', 'salad', 'rice',
    // Spanish
    'ensalada', 'pescado', 'pollo', 'hamburguesa',
    // German
    'salat', 'fisch', 'hähnchen', 'haehnchen', 'hamburger',
    // French
    'salade', 'poisson', 'poulet',
    // Hindi (common loanwords)
    'पास्ता', 'पिज़्ज़ा', 'पिज्जा', 'सलाद', 'बर्गर',
    // Japanese
    'パスタ', 'ピザ', 'サラダ', 'ハンバーガー', '魚', '鶏',
  ]),
  drink: (text) => includesAny(text, [
    'drink',
    // English
    'water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine', 'cola', 'lemonade',
    // Spanish
    'agua', 'jugo', 'zumo', 'refresco', 'cafe', 'café', 'te', 'té', 'cerveza', 'vino',
    // German
    'wasser', 'saft', 'limo', 'limonade', 'kaffee', 'tee', 'bier', 'wein',
    // French
    'eau', 'jus', 'soda', 'cafe', 'café', 'the', 'thé', 'bière', 'biere', 'vin',
    // Hindi
    'पानी', 'जूस', 'कॉफी', 'काफी', 'चाय', 'सोडा',
    // Japanese
    '水', 'ジュース', 'ソーダ', 'コーヒー', 'お茶', 'ビール', 'ワイン',
  ]),
  bill: (text) => includesAny(text, [
    'bill', 'check', 'receipt', 'pay', 'cash', 'card', 'total',
    // Spanish / German / French / Hindi / Japanese
    'la cuenta', 'cuenta', 'factura', 'pagar', 'tarjeta', 'efectivo',
    'rechnung', 'zahlen', 'karte', 'bar',
    'addition', 'l\'addition', 'payer',
    'बिल', 'भुगतान',
    '会計', 'お会計',
  ]),
  roomAvailability: (text) => includesAny(text, ['room', 'available', 'vacancy', 'single room', 'double room']),
  checkInDates: (text) => includesAny(text, ['check in', 'check out', 'date', 'night', 'nights', 'stay', 'from', 'to']),
  amenities: (text) => includesAny(text, ['wifi', 'breakfast', 'gym', 'amenities', 'facility', 'facilities', 'pool', 'parking']),
  confirmBooking: (text) => includesAny(text, ['book', 'booking', 'reserve', 'reservation', 'confirm', 'yes please']),
  attentionPolitely: (text) => includesAny(text, ['excuse me', 'hello', 'hi', 'please', 'sorry', 'can you help']),
  askLocation: (text) => includesAny(text, ['where is', 'how do i get', 'direction', 'directions', 'station', 'hotel', 'museum', 'airport', 'location']),
  understandDirections: (text) => includesAny(text, ['straight', 'left', 'right', 'block', 'blocks', 'turn', 'near', 'next to', 'across']),
  confirmUnderstanding: (text) => includesAny(text, ['got it', 'i understand', 'understood', 'okay', 'ok', 'let me repeat', 'so i go', 'right']),
  thankPerson: (text) => includesAny(text, ['thank you', 'thanks', 'thank u', 'appreciate', 'gracias', 'danke', 'merci']),
  introduceYourself: (text) => includesAny(text, ['my name is', 'i am', 'i m', 'i am a', 'let me introduce', 'about myself']),
  describeExperience: (text) => includesAny(text, ['experience', 'worked', 'years', 'project', 'previous role', 'background']),
  explainSkills: (text) => includesAny(text, ['skill', 'skills', 'strength', 'strengths', 'good at', 'expert', 'proficient', 'ability']),
  askPosition: (text) => includesAny(text, ['position', 'role', 'responsibilities', 'company', 'team', 'job', 'what does this role']),
  thankInterviewer: (text) => includesAny(text, ['thank you', 'thanks for your time', 'pleasure meeting', 'appreciate this opportunity']),
  askProduct: (text) => {
    // Avoid capturing later-step intents (price/confirm/pay).
    if (includesAny(text, [
      'price', 'cost', 'how much', '$', '€', '£', '₹', 'rs', 'rupees', 'dollars', 'pounds', 'euros', 'discount', 'offer',
      'deal', 'best price', 'lower', 'take it', 'i will take it', 'i ll take it', 'confirm', 'conform',
      'pay', 'payment', 'receipt', 'cash', 'card',
    ])) {
      return false;
    }

    const product = detectShoppingProduct(text);
    return Boolean(product);
  },
  askPrice: (text) => includesAny(text, ['price', 'cost', 'how much', 'expensive', 'cheap', 'discount', 'offer', '$', '€', '£', '₹', 'rs', 'rupees', 'dollars', 'pounds', 'euros']),
  negotiateOrConfirm: (text) => includesAny(text, ['can you lower', 'best price', 'deal', 'okay i ll take it', 'i will take it', 'i ll take it', 'sounds good', 'confirm', 'conform']),
  completePurchase: (text) => includesAny(text, ['buy', 'purchase', 'pack it', 'wrap it', 'receipt', 'pay', 'cash', 'card']),
  hailTaxi: (text) => includesAny(text, ['taxi', 'cab', 'hello', 'hi', 'hey', 'hello driver', 'can you take me', 'excuse me']),
  tellDestination: (text) => Boolean(detectTaxiDestination(text)) || includesAny(text, ['to the', 'take me to', 'destination', 'go to', 'going to', 'head to', 'heading to', 'airport', 'station', 'hotel', 'office', 'mall', 'downtown', 'city center', 'hospital', 'museum']),
  askFare: (text) => includesAny(text, ['fare', 'cost', 'price', 'how much', 'meter', 'charge']),
  smallTalkRide: (text) => includesAny(text, [
    'weather',
    'traffic',
    'where are you from',
    'are you from',
    'i am visiting',
    'i\'m visiting',
    'nice city',
    'nice place',
    'beautiful city',
    'busy today',
    'busy here',
    'always busy',
    'busy',
    'crowded',
    'rush hour',
    'tell me about yourself',
    'about yourself',
    'how are you',
    'how\'s your day',
    'how is your day',
    'do you like',
    'how long have you been driving',
    'have you been driving',
  ]),
  payAndThank: (text) => includesAny(text, ['here is', 'keep the change', 'thank you', 'thanks', 'card', 'cash', 'payment']),
};

const objectiveReminders = {
  greet: 'Try greeting politely first.',
  menu: 'Try asking for the menu clearly.',
  mainDish: 'Try ordering a specific main dish.',
  drink: 'Try ordering a drink.',
  bill: 'Try asking for the bill/check.',
  roomAvailability: 'Ask if a room is available.',
  checkInDates: 'Mention your check-in and check-out dates or number of nights.',
  amenities: 'Ask about amenities like WiFi or breakfast.',
  confirmBooking: 'Confirm you want to book the room.',
  attentionPolitely: 'Start politely, for example: excuse me, can you help me?',
  askLocation: 'Ask for a specific place and directions.',
  understandDirections: 'Repeat or mention direction words like left, right, or straight.',
  confirmUnderstanding: 'Confirm you understood, like: got it, thank you.',
  thankPerson: 'Thank the person to complete the interaction.',
  introduceYourself: 'Introduce yourself briefly.',
  describeExperience: 'Describe relevant work/project experience.',
  explainSkills: 'Mention your key skills or strengths.',
  askPosition: 'Ask a question about the role or company.',
  thankInterviewer: 'End by thanking the interviewer.',
  askProduct: 'Ask about a specific product or item.',
  askPrice: 'Ask the price or discount.',
  negotiateOrConfirm: 'Negotiate or confirm you want the item.',
  completePurchase: 'Complete purchase by asking to pay/get receipt.',
  hailTaxi: 'Hail the taxi politely first (for example: “Hello, taxi!”).',
  tellDestination: 'Tell the driver your destination clearly. Examples: “Take me to the airport”, “Go to the train station”, “I want to go to the city center”, or just type a place name like “Paris”.',
  askFare: 'Ask about fare or meter cost.',
  smallTalkRide: 'Say a short small-talk sentence during the ride.',
  payAndThank: 'Pay and thank the driver.',
};

const missionObjectiveIntents = {
  restaurant: ['greet', 'menu', 'mainDish', 'drink', 'bill'],
  hotel: ['greet', 'roomAvailability', 'checkInDates', 'amenities', 'confirmBooking'],
  directions: ['attentionPolitely', 'askLocation', 'understandDirections', 'confirmUnderstanding', 'thankPerson'],
  interview: ['introduceYourself', 'describeExperience', 'explainSkills', 'askPosition', 'thankInterviewer'],
  shopping: ['greet', 'askProduct', 'askPrice', 'negotiateOrConfirm', 'completePurchase'],
  taxi: ['hailTaxi', 'tellDestination', 'askFare', 'smallTalkRide', 'payAndThank'],
};

const getResponseForObjective = (mission, prompts, objectiveIndex) => {
  const totalObjectives = mission.objectives.length;
  const totalResponses = prompts.responses.length;

  if (!totalResponses) {
    return null;
  }

  // Some missions have 1 fewer response because greeting is handled separately.
  const objectiveOffset = Math.max(totalObjectives - totalResponses, 0);
  const responseIndex = Math.min(Math.max(objectiveIndex - objectiveOffset, 0), totalResponses - 1);

  return prompts.responses[responseIndex] || null;
};

const detectObjectiveIndexFromMessage = (message, missionId) => {
  const normalizedMessage = normalizeMissionText(message);
  const missionIntents = missionObjectiveIntents[missionId] || [];

  for (let idx = 0; idx < missionIntents.length; idx += 1) {
    const intent = missionIntents[idx];
    const matcher = objectiveMatchers[intent];
    if (typeof matcher === 'function' && matcher(normalizedMessage)) {
      return idx;
    }
  }

  return -1;
};

const detectDirectionsPlaceKey = (message) => {
  const text = normalizeMissionText(message);

  const matchers = [
    { key: 'train_station', words: ['train station', 'station', 'railway station', 'metro station', 'subway station'] },
    { key: 'hotel', words: ['hotel'] },
    { key: 'museum', words: ['museum'] },
    { key: 'airport', words: ['airport'] },
    { key: 'city_center', words: ['city center', 'centre', 'downtown', 'town center', 'center'] },
    { key: 'restaurant', words: ['restaurant', 'cafe', 'café'] },
    { key: 'hospital', words: ['hospital'] },
    { key: 'bus_stop', words: ['bus stop', 'bus station'] },
  ];

  const found = matchers.find(({ words }) => words.some((word) => text.includes(word)));
  return found?.key ?? null;
};

const DIRECTIONS_PLACE_LABELS = {
  English: {
    train_station: 'The train station',
    hotel: 'The hotel',
    museum: 'The museum',
    airport: 'The airport',
    city_center: 'The city center',
    restaurant: 'The restaurant',
    hospital: 'The hospital',
    bus_stop: 'The bus stop',
  },
  Spanish: {
    train_station: 'La estación de tren',
    hotel: 'El hotel',
    museum: 'El museo',
    airport: 'El aeropuerto',
    city_center: 'El centro de la ciudad',
    restaurant: 'El restaurante',
    hospital: 'El hospital',
    bus_stop: 'La parada de autobús',
  },
  German: {
    train_station: 'Der Bahnhof',
    hotel: 'Das Hotel',
    museum: 'Das Museum',
    airport: 'Der Flughafen',
    city_center: 'Das Stadtzentrum',
    restaurant: 'Das Restaurant',
    hospital: 'Das Krankenhaus',
    bus_stop: 'Die Bushaltestelle',
  },
  French: {
    train_station: 'La gare',
    hotel: "L'hôtel",
    museum: 'Le musée',
    airport: "L'aéroport",
    city_center: 'Le centre-ville',
    restaurant: 'Le restaurant',
    hospital: "L'hôpital",
    bus_stop: "L'arrêt de bus",
  },
  Hindi: {
    train_station: 'रेलवे स्टेशन',
    hotel: 'होटल',
    museum: 'संग्रहालय',
    airport: 'हवाई अड्डा',
    city_center: 'सिटी सेंटर',
    restaurant: 'रेस्टोरेंट',
    hospital: 'अस्पताल',
    bus_stop: 'बस स्टॉप',
  },
  Japanese: {
    train_station: '駅',
    hotel: 'ホテル',
    museum: '博物館',
    airport: '空港',
    city_center: '市内中心部',
    restaurant: 'レストラン',
    hospital: '病院',
    bus_stop: 'バス停',
  },
};

const getDynamicMissionResponse = ({ missionId, objectiveIndex, message, language, prompts }) => {
  if (missionId === 'shopping' && objectiveIndex === 1) {
    const product = detectShoppingProduct(message);
    if (product) {
      if (language === 'Hindi') {
        return `${product}? जी हाँ, हमारे पास उपलब्ध है। क्या आप कीमत जानना चाहेंगे?`;
      }

      if (language === 'Japanese') {
        return `${product}ですね。はい、ありますよ。値段をお知りになりたいですか？`;
      }

      return `${product}? Yes, we have that. Would you like to know the price?`;
    }
  }

  if (missionId === 'taxi' && objectiveIndex === 1) {
    const destination = detectTaxiDestination(message);
    const base = prompts.responses?.[1];
    if (destination && base) {
      if (language === 'Japanese') {
        return `${destination}ですね。${base}`;
      }

      if (language === 'Hindi') {
        return `${destination}? ${base}`;
      }

      return `${destination}? ${base}`;
    }
  }

  if (missionId !== 'directions') {
    return null;
  }

  // directions objectives: [attentionPolitely, askLocation, understandDirections, confirmUnderstanding, thankPerson]
  if (objectiveIndex !== 1) {
    return null;
  }

  const placeKey = detectDirectionsPlaceKey(message);
  if (!placeKey) {
    return null;
  }

  const labels = DIRECTIONS_PLACE_LABELS[language] || DIRECTIONS_PLACE_LABELS.English;
  const placeLabel = labels[placeKey] || labels.train_station;

  // prompts.responses[1] is the base direction instruction for the location step.
  const baseDirections = prompts.responses?.[1];
  if (!baseDirections) {
    return null;
  }

  if (language === 'Japanese') {
    return `${placeLabel}ですね。${baseDirections}`;
  }

  if (language === 'Hindi') {
    return `${placeLabel}? ${baseDirections}`;
  }

  return `${placeLabel}? ${baseDirections}`;
};

const getObjectiveReminder = (missionId, objectiveIndex, objectiveText) => {
  const objectiveIntent = missionObjectiveIntents[missionId]?.[objectiveIndex];
  if (objectiveIntent && objectiveReminders[objectiveIntent]) {
    return objectiveReminders[objectiveIntent];
  }

  return `Try completing this objective: ${objectiveText}`;
};

const Missions = () => {
  const [selectedMission, setSelectedMission] = useState(null);
  const [language, setLanguage] = useState('Spanish');
  const { updateUser } = useAuth();
  
  const languages = ['English', 'Spanish', 'German', 'French', 'Hindi', 'Japanese'];
  const missions = Object.values(missionScenarios);

  if (selectedMission) {
    return (
      <MissionChat 
        mission={missionScenarios[selectedMission]}
        language={language}
        onBack={() => setSelectedMission(null)}
        onComplete={async ({ missionId, objectivesCompleted, totalObjectives, xpEarned }) => {
          try {
            const response = await missionsAPI.completeMission({
              mission_id: missionId,
              language,
              objectives_completed: objectivesCompleted,
              total_objectives: totalObjectives,
              xp_earned: xpEarned,
            });

            const message = response?.data?.message || `Mission Complete! +${xpEarned} XP earned!`;
            toast.success(message);
            await updateUser();
          } catch (error) {
            const detail = error.response?.data?.detail;
            const errorMessage = Array.isArray(detail)
              ? detail.map((item) => item.msg || item.message).filter(Boolean).join(', ')
              : detail;
            toast.error(errorMessage || 'Mission completed locally, but failed to sync XP.');
          }
        }}
      />
    );
  }

  return (
    <div className="missions-page">
      <div className="missions-header">
        <h1><FiTarget /> Real-World Missions</h1>
        <p>Complete real-life scenarios using voice or text. Practice like you're actually there!</p>
        
        <div className="language-selector">
          <label>Select Language:</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="missions-grid">
        {missions.map(mission => (
          <div 
            key={mission.id} 
            className="mission-card"
            style={{ '--mission-color': mission.color }}
            onClick={() => setSelectedMission(mission.id)}
          >
            <div className="mission-icon">{mission.icon}</div>
            <div className="mission-info">
              <h3>{mission.name}</h3>
              <p>{mission.description}</p>
              <div className="mission-meta">
                <span className={`difficulty ${mission.difficulty.toLowerCase()}`}>
                  {mission.difficulty}
                </span>
                <span className="xp-reward">
                  <FiStar /> {mission.xpReward} XP
                </span>
              </div>
            </div>
            <div className="mission-roles">
              <span>You: {mission.roles.user}</span>
              <span>AI: {mission.roles.ai}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="missions-tips">
        <h3>💡 Tips for Success</h3>
        <ul>
          <li>🎤 Use the microphone to practice speaking</li>
          <li>🔊 Listen to AI responses to improve pronunciation</li>
          <li>✅ Complete all objectives to earn full XP</li>
          <li>🔄 Try the same mission multiple times to build confidence</li>
        </ul>
      </div>
    </div>
  );
};

// Mission Chat Component
const MissionChat = ({ mission, language, onBack, onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentObjective, setCurrentObjective] = useState(0);
  const [completedObjectives, setCompletedObjectives] = useState([]);
  const [missionComplete, setMissionComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const prompts = mission.prompts[language] || mission.prompts['English'];

  // Initialize with AI greeting
  useEffect(() => {
    const greeting = {
      role: 'assistant',
      content: prompts.greeting,
      emotion: 'friendly'
    };
    setMessages([greeting]);
    speakText(prompts.greeting);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language for recognition
      const langCodes = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'German': 'de-DE',
        'French': 'fr-FR',
        'Hindi': 'hi-IN',
        'Japanese': 'ja-JP'
      };
      recognitionRef.current.lang = langCodes[language] || 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Could not recognize speech. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language
      const langCodes = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'German': 'de-DE',
        'French': 'fr-FR',
        'Hindi': 'hi-IN',
        'Japanese': 'ja-JP'
      };
      utterance.lang = langCodes[language] || 'en-US';
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const analyzeEmotion = (text) => {
    // Simple emotion detection based on punctuation and keywords
    const lowerText = text.toLowerCase();
    if (text.includes('!') || lowerText.includes('great') || lowerText.includes('excellent')) {
      return 'excited';
    } else if (text.includes('?')) {
      return 'curious';
    } else if (lowerText.includes('thank') || lowerText.includes('please')) {
      return 'polite';
    }
    return 'neutral';
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userEmotion = analyzeEmotion(input);
    const currentObjectiveText = mission.objectives[currentObjective] || '';
    const detectedObjectiveIndex = detectObjectiveIndexFromMessage(input, mission.id);
    const objectiveMatched = detectedObjectiveIndex === currentObjective;
    const userMessage = {
      role: 'user',
      content: input,
      emotion: userEmotion
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate AI response
    setTimeout(() => {
      // Enforce objective order: only respond for the *current* objective.
      // If the user jumps ahead, show the current objective reminder instead.
      const matchedObjectiveResponse = objectiveMatched
        ? getResponseForObjective(mission, prompts, currentObjective)
        : null;

      const dynamicResponse = objectiveMatched
        ? getDynamicMissionResponse({
          missionId: mission.id,
          objectiveIndex: currentObjective,
          message: input,
          language,
          prompts,
        })
        : null;

      const aiResponse = objectiveMatched
        ? (dynamicResponse || matchedObjectiveResponse || getObjectiveReminder(mission.id, currentObjective, currentObjectiveText))
        : getObjectiveReminder(mission.id, currentObjective, currentObjectiveText);
      
      const aiMessage = {
        role: 'assistant',
        content: aiResponse,
        emotion: 'friendly'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      speakText(aiResponse);

      if (objectiveMatched) {
        setCompletedObjectives(prev => (prev.includes(currentObjective) ? prev : [...prev, currentObjective]));

        // Move to next objective
        if (currentObjective < mission.objectives.length - 1) {
          setCurrentObjective(currentObjective + 1);
        } else {
          // Mission complete!
          setTimeout(() => {
            setMissionComplete(true);
            onComplete({
              missionId: mission.id,
              objectivesCompleted: completedObjectives.length + 1,
              totalObjectives: mission.objectives.length,
              xpEarned: mission.xpReward,
            });
          }, 2000);
        }
      }
    }, 1000);
  };

  if (missionComplete) {
    return (
      <div className="mission-container">
        <div className="mission-complete">
          <div className="celebration">🎉</div>
          <h2>Mission Complete!</h2>
          <div className="mission-summary">
            <p>You successfully completed: <strong>{mission.name}</strong></p>
            <div className="objectives-summary">
              {mission.objectives.map((obj, idx) => (
                <div key={idx} className="objective-item completed">
                  <FiCheck /> {obj}
                </div>
              ))}
            </div>
            <div className="xp-earned">+{mission.xpReward} XP</div>
          </div>
          <button className="btn-primary" onClick={onBack}>
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-container">
      <div className="mission-header">
        <button className="btn-back" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <div className="mission-title">
          {mission.icon}
          <span>{mission.name}</span>
        </div>
        <div className="mission-role">
          You: {mission.roles.user} | AI: {mission.roles.ai}
        </div>
      </div>

      <div className="objectives-panel">
        <h4>Objectives</h4>
        <div className="objectives-list">
          {mission.objectives.map((obj, idx) => (
            <div 
              key={idx} 
              className={`objective ${completedObjectives.includes(idx) ? 'completed' : ''} ${idx === currentObjective ? 'current' : ''}`}
            >
              {completedObjectives.includes(idx) ? <FiCheck /> : <span className="obj-number">{idx + 1}</span>}
              {obj}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
                {msg.emotion && (
                  <span className={`emotion-tag ${msg.emotion}`}>
                    {msg.emotion === 'excited' && '😊'}
                    {msg.emotion === 'curious' && '🤔'}
                    {msg.emotion === 'polite' && '🙏'}
                    {msg.emotion === 'friendly' && '😄'}
                    {msg.emotion === 'neutral' && '😐'}
                  </span>
                )}
              </div>
              {msg.role === 'assistant' && (
                <button 
                  className="speak-btn"
                  onClick={() => speakText(msg.content)}
                  disabled={isSpeaking}
                >
                  <FiVolume2 />
                </button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="voice-controls">
            <button 
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
              {isListening ? 'Stop' : 'Speak'}
            </button>
          </div>
          
          <div className="text-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Type or speak in ${language}...`}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!input.trim()}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>

      {isListening && (
        <div className="listening-indicator">
          <div className="pulse"></div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
};

export default Missions;

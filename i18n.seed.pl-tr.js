/**
 * i18n.seed.pl-tr.js — Polish (pl) and Turkish (tr) seed translations.
 *
 * Same shape as SEED_TRANSLATIONS in i18n.js: { key: { lang: value } }.
 * These are merged into the main seed on boot and only inserted when the row
 * does not already exist, so edits made through PUT /api/i18n are never
 * overwritten.
 *
 * NOTE: machine-drafted. Have a native speaker review before production,
 * especially the product descriptions and the AI instruction.
 */
module.exports = {
  // ── Course titles ───────────────────────────────────────────────────────
  'course.genially-course-1.title': {
    pl: 'Protokół K-Obiol i Actellic',
    tr: 'K-Obiol ve Actellic Protokolü',
  },
  'course.6ab28a2999831fbc0bd81f32_Progress_static_1_2.title': {
    pl: 'Szkolenie wprowadzające Envu (e-learning)',
    tr: 'Envu Oryantasyon E-Öğrenimi',
  },
  'course.6ab28a6e29c842f5b7c98bc5_Progress_static_1_2.title': {
    pl: 'Protokoły operacyjne T&O',
    tr: 'T&O Operasyonel Protokolleri',
  },

  // ── My Learning UI strings ──────────────────────────────────────────────
  'courses.title': { pl: 'Moja nauka', tr: 'Öğrenimim' },
  'courses.subtitle': {
    pl: 'Szkolenia w toku i ukończone',
    tr: 'Devam eden ve tamamlanan eğitimler',
  },
  'courses.wakingUp': {
    pl: 'Uruchamianie serwera w chmurze...',
    tr: 'Bulut sunucusu başlatılıyor...',
  },
  'courses.wakingUpDetail': {
    pl: 'Darmowy plan Render usypia serwer po okresie nieaktywności. Zwykle trwa to 30–50 sekund.',
    tr: "Render'ın ücretsiz planı, hareketsizlikten sonra sunucuyu uyutur. Bu genellikle 30-50 saniye sürer.",
  },
  'courses.footer': {
    pl: 'Bezpieczna platforma szkoleniowa SCORM 1.2',
    tr: 'Güvenli SCORM 1.2 Öğrenme Platformu',
  },
  'courses.done': { pl: 'Gotowe', tr: 'Tamamlandı' },

  // ── AI prompt language instruction ──────────────────────────────────────
  'ai.instruction': {
    pl: 'Napisz pola "insect" i "threatLevel" po polsku. Przetłumacz nazwę szkodnika i opis poziomu zagrożenia na język polski.',
    tr: '"insect" ve "threatLevel" alanlarını Türkçe yaz. Zararlı adını ve tehdit seviyesi açıklamasını Türkçeye çevir.',
  },

  // ── Product descriptions ────────────────────────────────────────────────
  'product.Exteris® Stressgard 5l.description': {
    pl: 'Fungicyd do trawników.',
    tr: 'Çim alanlar için fungisit.',
  },
  'product.Fiata® Boost 1kg.description': {
    pl: 'Fungicyd do trawników.',
    tr: 'Çim alanlar için fungisit.',
  },
  'product.Signature® Xtra Stressgard 5kg.description': {
    pl: 'Fungicyd do trawników.',
    tr: 'Çim alanlar için fungisit.',
  },
  'product.Valdor® Expert.description': {
    pl: 'Herbicyd do zwalczania chwastów.',
    tr: 'Yabancı ot kontrolü için herbisit.',
  },
  'product.Aqua K-Othrine® 1l.description': {
    pl: 'Deltametryna z technologią FFAST. Stosowana w zabiegach ULV i zamgławiania w ogólnym zwalczaniu szkodników, takich jak muchy, pluskwy i owady pełzające. NIE jest głównym produktem przeciw komarom.',
    tr: 'FFAST teknolojisine sahip deltametrin. Sinekler, tahtakuruları ve sürünen böcekler gibi genel zararlı yönetimi senaryolarında ULV ve sisleme için kullanılır. Birincil sivrisinek ürünü DEĞİLDİR.',
  },
  'product.AquaPy® 1l.description': {
    pl: 'Szybko działający środek owadobójczy na bazie pyretryn do zwalczania pełzających szkodników w zdrowiu publicznym.',
    tr: 'Halk sağlığı alanındaki sürünen zararlılar için hızlı etkili, piretrin bazlı böcek kontrol ürünü.',
  },
  'product.DEDEVAP® Green.description': {
    pl: 'Aerozol z naturalnych pyretryn do magazynów zbóż. Zwalcza szkodniki produktów przechowywanych, takie jak ryjkowce i chrząszcze zbożowe.',
    tr: 'Tahıl depolama tesisleri için doğal piretrin aerosolü. Tahıl böcekleri ve ambar biti gibi depolanmış ürün zararlılarını hedefler.',
  },
  'product.Harmonix® Monitoring Paste 5kg.description': {
    pl: 'Przynęta monitorująca do wykrywania aktywności szczurów i myszy w strategiach IPM.',
    tr: 'EZY stratejilerinde sıçan ve fare aktivitesini tespit etmek için izleme yemi.',
  },
  'product.Harmonix® Rodent Paste 5kg.description': {
    pl: 'Rodentycyd na bazie cholekalcyferolu (witaminy D3) do zwalczania szczurów i myszy.',
    tr: 'Sıçan ve fare kontrolü için kolekalsiferol (D3 vitamini) bazlı rodentisit.',
  },
  'product.K-Obiol® EC25 1l.description': {
    pl: 'Deltametryna EC do ochrony przechowywanego ziarna przed chrząszczami, ryjkowcami i innymi szkodnikami produktów przechowywanych.',
    tr: 'Depolanmış tahılı böceklere, buğday biti ve diğer depolanmış ürün zararlılarına karşı korumak için deltametrin EC.',
  },
  'product.K-Obiol® ULV6 20L.description': {
    pl: 'Środek ULV na bazie pyretryn do szybkiego zwalczania owadów latających podczas zabiegów w magazynach zbóż.',
    tr: 'Tahıl depolama alanı uygulamalarında uçan böcekleri hızla yere düşürmek için piretrin bazlı ULV.',
  },
  'product.K-Othrine® Flow 25.description': {
    pl: 'Zawiesina deltametryny do zwalczania karaluchów, mrówek, pluskiew i owadów pełzających. Długotrwałe działanie rezydualne.',
    tr: 'Hamamböcekleri, karıncalar, tahtakuruları ve sürünen böcekler için deltametrin süspansiyonu. Uzun süreli kalıcı etki.',
  },
  'product.K-Othrine® Partix 240ml.description': {
    pl: 'Deltametryna z technologią Partix. Najlepsza do zwalczania karaluchów na powierzchniach porowatych i złożonych.',
    tr: 'Partix teknolojisine sahip deltametrin. Gözenekli ve karmaşık yüzeylerdeki hamamböcekleri için en uygunudur.',
  },
  'product.K-Othrine® SC 7.5.description': {
    pl: 'Szerokospektralna deltametryna SC do zwalczania karaluchów, much oraz ogólnie szkodników pełzających i latających.',
    tr: 'Hamamböcekleri, sinekler ve genel olarak sürünen/uçan zararlıların yönetimi için geniş spektrumlu deltametrin SC.',
  },
  'product.Maxforce® Platin 30g.description': {
    pl: 'Żelowa przynęta BlueBead z klotianidyną przeznaczona specjalnie do karaluchów. Bardzo atrakcyjna matryca przynęty.',
    tr: 'Özellikle hamamböcekleri için klotianidin içeren BlueBead jel yem. Son derece çekici bir yem matrisi.',
  },
  'product.Maxforce® Quantum 30g.description': {
    pl: 'Węglowodanowa przynęta w żelu opracowana specjalnie dla mrówek. Technologia higroskopijna zapewnia atrakcyjność przynęty.',
    tr: 'Özellikle karıncalar için geliştirilmiş karbonhidrat bazlı sıvı jel yem. Higroskopik teknoloji yemin cazibesini korur.',
  },
  'product.Maxforce® White IC.description': {
    pl: 'Żelowa przynęta z imidaklopridem do szczelin i pęknięć, przeznaczona do zwalczania karaluchów w pomieszczeniach.',
    tr: 'İç mekanlardaki hamamböcekleri için çatlak-yarık uygulamasına uygun imidakloprid jel yem.',
  },
  'product.Racumin® Foam 500ml.description': {
    pl: 'Pianka rodentycydowa bez przynęty, zabijająca szczury i myszy poprzez wylizywanie sierści. Idealna tam, gdzie akceptacja przynęty jest niska.',
    tr: 'Sıçan ve fareleri temizlenme yoluyla öldüren, yemsiz rodentisit köpük. Yem kabulünün düşük olduğu yerler için idealdir.',
  },
  'product.Rodilon® Block 3kg.description': {
    pl: 'Odporna na wilgoć przynęta blokowa z difetialonem do zwalczania szczurów i myszy w trudnych warunkach.',
    tr: 'Zorlu ortamlarda sıçan ve fare kontrolü için neme dayanıklı difetialon blok yem.',
  },
  'product.Rodilon® Haver Mix 3kg.description': {
    pl: 'Przynęta z mieszanki ziaren z difetialonem dla gryzoni, o wysokiej akceptacji.',
    tr: 'Kemirgenler için yüksek yem kabulüne sahip difetialonlu karışık tahıl yemi.',
  },
  'product.Rodilon® Pasta 5kg.description': {
    pl: 'Miękki blok z difetialonem do zwalczania szczurów i myszy w różnych scenariuszach zasiedlenia.',
    tr: 'Çeşitli istila senaryolarında sıçan ve fareler için difetialonlu yumuşak blok.',
  },
  'product.Rodilon® Wheat Tech 3kg.description': {
    pl: 'Formulacja przynęty pszenicznej z difetialonem, bardzo atrakcyjna dla gryzoni.',
    tr: 'Kemirgen kontrolünde son derece çekici, difetialonlu buğday teknolojisi yem formülasyonu.',
  },
  'product.Aqua K-Othrine® EW20 1l.description': {
    pl: 'GŁÓWNY PRODUKT PRZECIW KOMAROM. Deltametryna EW20 z technologią FFAST, opracowana specjalnie do zamgławiania termicznego ULV w celu zwalczania komarów, w tym gatunków Aedes, Anopheles i Culex.',
    tr: 'BİRİNCİL SİVRİSİNEK ÜRÜNÜ. Aedes, Anopheles ve Culex türleri dahil sivrisinekleri öldürmek için ULV termal sisleme amacıyla özel olarak tasarlanmış, FFAST teknolojili deltametrin EW20.',
  },
  'product.K-Othrine® WG250 2.5g.description': {
    pl: 'Granulat do sporządzania zawiesiny z deltametryną do zwalczania komarów jako wektorów chorób w higienie publicznej. Produkt uzupełniający przeciw komarom.',
    tr: 'Halk hijyeninde vektör sivrisinek kontrolü için deltametrin içeren ıslanabilir granül. İkincil sivrisinek ürünüdür.',
  },
};

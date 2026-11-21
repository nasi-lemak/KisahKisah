/**
 * Starter film catalogue. Southeast Asian titles first, then the wider region.
 * Synopses are our own one-liners. Posters are generated (see poster.ts), so
 * no third-party artwork ships with the app.
 */
export type CatalogFilm = {
  slug: string;
  title: string;
  originalTitle?: string;
  year: number;
  country: string;
  director: string;
  genres: string[];
  motif: string; // an emoji used on the generated poster
  synopsis: string;
};

export const GENRES = [
  "Drama", "Comedy", "Horror", "Action", "Thriller", "Romance", "Animation",
  "Family", "History", "Sports", "Sci-Fi", "Fantasy", "Crime", "Documentary", "Musical",
] as const;

export const CATALOG: CatalogFilm[] = [
  // 🇲🇾 Malaysia
  { slug: "ola-bola-2016", title: "Ola Bola", year: 2016, country: "MY", director: "Chiu Keng Guan", genres: ["Sports", "Drama", "History"], motif: "⚽", synopsis: "A squabbling national football squad learns to play as one on the road to the 1980 Olympic qualifiers." },
  { slug: "mat-kilau-2022", title: "Mat Kilau", originalTitle: "Mat Kilau: Kebangkitan Pahlawan", year: 2022, country: "MY", director: "Syamsul Yusof", genres: ["Action", "History"], motif: "🗡️", synopsis: "In 1890s Pahang, a reluctant warrior rallies villagers against colonial rule." },
  { slug: "tiger-stripes-2023", title: "Tiger Stripes", year: 2023, country: "MY", director: "Amanda Nell Eu", genres: ["Horror", "Drama"], motif: "🐯", synopsis: "A twelve-year-old's body begins to change in ways her rural school cannot contain." },
  { slug: "the-journey-2014", title: "The Journey", year: 2014, country: "MY", director: "Chiu Keng Guan", genres: ["Comedy", "Drama", "Family"], motif: "🛵", synopsis: "A stubborn father and his daughter's English fiancé ride across the peninsula to hand-deliver wedding invitations." },
  { slug: "upin-ipin-keris-siamang-tunggal-2019", title: "Upin & Ipin: The Lone Gibbon Kris", originalTitle: "Upin & Ipin: Keris Siamang Tunggal", year: 2019, country: "MY", director: "Adam Bin Amiruddin", genres: ["Animation", "Family", "Fantasy"], motif: "👦", synopsis: "The twins and friends are pulled into a magical kingdom and must recover a legendary kris." },
  { slug: "polis-evo-2015", title: "Polis Evo", year: 2015, country: "MY", director: "Ghaz Abu Bakar", genres: ["Action", "Comedy", "Crime"], motif: "🚓", synopsis: "A by-the-book KL cop and a hot-headed Terengganu detective team up to bust a drug ring." },
  { slug: "abang-adik-2023", title: "Abang Adik", originalTitle: "富都青年", year: 2023, country: "MY", director: "Jin Ong", genres: ["Drama", "Crime"], motif: "🏚️", synopsis: "Two undocumented brothers scrape by in Pudu until one terrible night tests their bond." },
  // 🇮🇩 Indonesia
  { slug: "satans-slaves-2017", title: "Satan's Slaves", originalTitle: "Pengabdi Setan", year: 2017, country: "ID", director: "Joko Anwar", genres: ["Horror"], motif: "🔔", synopsis: "After their mother dies, a family hears her bell ringing in the night." },
  { slug: "the-raid-2011", title: "The Raid", originalTitle: "Serbuan Maut", year: 2011, country: "ID", director: "Gareth Evans", genres: ["Action", "Thriller", "Crime"], motif: "🥋", synopsis: "A SWAT team fights floor by floor through a tower block run by a crime lord." },
  { slug: "marlina-2017", title: "Marlina the Murderer in Four Acts", originalTitle: "Marlina si Pembunuh dalam Empat Babak", year: 2017, country: "ID", director: "Mouly Surya", genres: ["Thriller", "Drama"], motif: "🐎", synopsis: "A widow on Sumba takes justice into her own hands and sets out across the savanna." },
  { slug: "impetigore-2019", title: "Impetigore", originalTitle: "Perempuan Tanah Jahanam", year: 2019, country: "ID", director: "Joko Anwar", genres: ["Horror", "Thriller"], motif: "🎎", synopsis: "A woman returns to her ancestral village and finds out why its children are born without skin." },
  { slug: "agak-laen-2024", title: "Agak Laen", year: 2024, country: "ID", director: "Muhadkly Acho", genres: ["Comedy", "Horror"], motif: "🎢", synopsis: "Four friends running a fading ghost house accidentally make it genuinely haunted." },
  // 🇹🇭 Thailand
  { slug: "bad-genius-2017", title: "Bad Genius", originalTitle: "ฉลาดเกมส์โกง", year: 2017, country: "TH", director: "Nattawut Poonpiriya", genres: ["Thriller", "Drama", "Crime"], motif: "✏️", synopsis: "A star student turns exam cheating into a business and takes it international." },
  { slug: "how-to-make-millions-2024", title: "How to Make Millions Before Grandma Dies", originalTitle: "หลานม่า", year: 2024, country: "TH", director: "Pat Boonnitipat", genres: ["Drama", "Family", "Comedy"], motif: "👵", synopsis: "A slacker moves in to care for his ailing grandmother, with one eye on the inheritance." },
  { slug: "shutter-2004", title: "Shutter", originalTitle: "ชัตเตอร์ กดติดวิญญาณ", year: 2004, country: "TH", director: "Banjong Pisanthanakun", genres: ["Horror"], motif: "📷", synopsis: "A photographer finds a pale shape appearing in every picture he develops." },
  { slug: "pee-mak-2013", title: "Pee Mak", originalTitle: "พี่มาก..พระโขนง", year: 2013, country: "TH", director: "Banjong Pisanthanakun", genres: ["Comedy", "Horror", "Romance"], motif: "🛶", synopsis: "A soldier returns from war to his loving wife, and his friends suspect she isn't quite alive." },
  { slug: "uncle-boonmee-2010", title: "Uncle Boonmee Who Can Recall His Past Lives", originalTitle: "ลุงบุญมีระลึกชาติ", year: 2010, country: "TH", director: "Apichatpong Weerasethakul", genres: ["Drama", "Fantasy"], motif: "🐒", synopsis: "In his final days, a farmer is visited by the spirits of his wife and his lost son." },
  // 🇵🇭 Philippines
  { slug: "heneral-luna-2015", title: "Heneral Luna", year: 2015, country: "PH", director: "Jerrold Tarog", genres: ["History", "Action", "Drama"], motif: "🎖️", synopsis: "A fiery general fights the Americans while his fellow Filipinos plot against him." },
  { slug: "hello-love-goodbye-2019", title: "Hello, Love, Goodbye", year: 2019, country: "PH", director: "Cathy Garcia-Molina", genres: ["Romance", "Drama"], motif: "💌", synopsis: "Two overseas Filipino workers in Hong Kong fall in love just as one is about to leave." },
  { slug: "four-sisters-and-a-wedding-2013", title: "Four Sisters and a Wedding", year: 2013, country: "PH", director: "Cathy Garcia-Molina", genres: ["Comedy", "Drama", "Family"], motif: "💒", synopsis: "Four sisters reunite to stop their baby brother's wedding." },
  // 🇸🇬 Singapore
  { slug: "ilo-ilo-2013", title: "Ilo Ilo", originalTitle: "爸妈不在家", year: 2013, country: "SG", director: "Anthony Chen", genres: ["Drama", "Family"], motif: "🏢", synopsis: "A Filipina domestic helper and a difficult boy form an unlikely bond during the 1997 financial crisis." },
  { slug: "ah-boys-to-men-2012", title: "Ah Boys to Men", originalTitle: "新兵正传", year: 2012, country: "SG", director: "Jack Neo", genres: ["Comedy", "Drama"], motif: "🪖", synopsis: "A pampered recruit tries every trick to get out of National Service." },
  // 🇻🇳 Vietnam
  { slug: "the-third-wife-2018", title: "The Third Wife", originalTitle: "Vợ Ba", year: 2018, country: "VN", director: "Ash Mayfair", genres: ["Drama"], motif: "🪷", synopsis: "In 19th-century rural Vietnam, a fourteen-year-old becomes a landowner's third wife." },
  { slug: "dad-im-sorry-2021", title: "Dad, I'm Sorry", originalTitle: "Bố Già", year: 2021, country: "VN", director: "Trấn Thành", genres: ["Drama", "Comedy", "Family"], motif: "🛵", synopsis: "A cantankerous Saigon father and his YouTuber son clash under one small roof." },
  { slug: "mai-2024", title: "Mai", year: 2024, country: "VN", director: "Trấn Thành", genres: ["Romance", "Drama"], motif: "🌼", synopsis: "A masseuse with a painful past is pursued by a carefree younger neighbour." },
  { slug: "scent-of-green-papaya-1993", title: "The Scent of Green Papaya", originalTitle: "Mùi đu đủ xanh", year: 1993, country: "VN", director: "Trần Anh Hùng", genres: ["Drama"], motif: "🥭", synopsis: "A young servant girl in 1950s Saigon grows up quietly observing the household she serves." },
  // 🇰🇭 Cambodia · 🇱🇦 Laos
  { slug: "the-missing-picture-2013", title: "The Missing Picture", originalTitle: "L'image manquante", year: 2013, country: "KH", director: "Rithy Panh", genres: ["Documentary", "History"], motif: "🧸", synopsis: "Clay figurines recreate the images of the Khmer Rouge years that no camera kept." },
  { slug: "the-long-walk-2019", title: "The Long Walk", year: 2019, country: "LA", director: "Mattie Do", genres: ["Sci-Fi", "Horror", "Drama"], motif: "🚶", synopsis: "An old scavenger who can see a ghost uses her to travel back to the day his mother died." },
  // 🇰🇷 South Korea
  { slug: "parasite-2019", title: "Parasite", originalTitle: "기생충", year: 2019, country: "KR", director: "Bong Joon-ho", genres: ["Thriller", "Drama", "Comedy"], motif: "🪨", synopsis: "A poor family cons its way, one job at a time, into a wealthy household." },
  { slug: "train-to-busan-2016", title: "Train to Busan", originalTitle: "부산행", year: 2016, country: "KR", director: "Yeon Sang-ho", genres: ["Horror", "Action", "Thriller"], motif: "🚄", synopsis: "A workaholic father and his daughter board a KTX just as an outbreak hits." },
  { slug: "oldboy-2003", title: "Oldboy", originalTitle: "올드보이", year: 2003, country: "KR", director: "Park Chan-wook", genres: ["Thriller", "Crime"], motif: "🔨", synopsis: "Released after fifteen years of unexplained captivity, a man has five days to learn why." },
  { slug: "decision-to-leave-2022", title: "Decision to Leave", originalTitle: "헤어질 결심", year: 2022, country: "KR", director: "Park Chan-wook", genres: ["Romance", "Thriller", "Crime"], motif: "⛰️", synopsis: "An insomniac detective falls for the widow he is supposed to be investigating." },
  { slug: "exhuma-2024", title: "Exhuma", originalTitle: "파묘", year: 2024, country: "KR", director: "Jang Jae-hyun", genres: ["Horror", "Thriller"], motif: "⚱️", synopsis: "A shaman, a geomancer and an undertaker dig up a grave that should have stayed closed." },
  // 🇨🇳 China · 🇭🇰 Hong Kong · 🇹🇼 Taiwan
  { slug: "farewell-my-concubine-1993", title: "Farewell My Concubine", originalTitle: "霸王别姬", year: 1993, country: "CN", director: "Chen Kaige", genres: ["Drama", "History", "Romance"], motif: "🎭", synopsis: "Two Peking Opera stars' half-century friendship survives war, revolution and each other." },
  { slug: "ne-zha-2019", title: "Ne Zha", originalTitle: "哪吒之魔童降世", year: 2019, country: "CN", director: "Jiaozi", genres: ["Animation", "Fantasy", "Action"], motif: "🔥", synopsis: "A boy born from a demon pearl fights the destiny everyone has written for him." },
  { slug: "the-wandering-earth-2019", title: "The Wandering Earth", originalTitle: "流浪地球", year: 2019, country: "CN", director: "Frant Gwo", genres: ["Sci-Fi", "Action"], motif: "🌏", synopsis: "Humanity strapped engines to the planet to escape a dying sun. Now Jupiter is in the way." },
  { slug: "hi-mom-2021", title: "Hi, Mom", originalTitle: "你好，李焕英", year: 2021, country: "CN", director: "Jia Ling", genres: ["Comedy", "Drama", "Fantasy"], motif: "🚲", synopsis: "A daughter is thrown back to 1981 and tries to make her young mother happy." },
  { slug: "in-the-mood-for-love-2000", title: "In the Mood for Love", originalTitle: "花樣年華", year: 2000, country: "HK", director: "Wong Kar-wai", genres: ["Romance", "Drama"], motif: "🌹", synopsis: "Neighbours in 1962 Hong Kong discover their spouses are having an affair, and almost do the same." },
  { slug: "infernal-affairs-2002", title: "Infernal Affairs", originalTitle: "無間道", year: 2002, country: "HK", director: "Andrew Lau, Alan Mak", genres: ["Crime", "Thriller"], motif: "📟", synopsis: "A cop undercover in a triad and a mole inside the police race to expose each other." },
  { slug: "yi-yi-2000", title: "Yi Yi", originalTitle: "一一", year: 2000, country: "TW", director: "Edward Yang", genres: ["Drama", "Family"], motif: "📸", synopsis: "A year in the life of a Taipei family, from a wedding to a funeral." },
  { slug: "cape-no-7-2008", title: "Cape No. 7", originalTitle: "海角七號", year: 2008, country: "TW", director: "Wei Te-sheng", genres: ["Romance", "Musical", "Comedy"], motif: "🎸", synopsis: "A failed rocker turned postman finds undelivered love letters from the 1940s." },
  // 🇯🇵 Japan
  { slug: "spirited-away-2001", title: "Spirited Away", originalTitle: "千と千尋の神隠し", year: 2001, country: "JP", director: "Hayao Miyazaki", genres: ["Animation", "Fantasy", "Family"], motif: "🐉", synopsis: "A sulky ten-year-old must work in a bathhouse for spirits to save her parents." },
  { slug: "shoplifters-2018", title: "Shoplifters", originalTitle: "万引き家族", year: 2018, country: "JP", director: "Hirokazu Kore-eda", genres: ["Drama", "Family", "Crime"], motif: "🍊", synopsis: "A makeshift family of petty thieves takes in a little girl they find out in the cold." },
  { slug: "your-name-2016", title: "Your Name.", originalTitle: "君の名は。", year: 2016, country: "JP", director: "Makoto Shinkai", genres: ["Animation", "Romance", "Fantasy"], motif: "☄️", synopsis: "A Tokyo boy and a country girl begin waking up in each other's bodies." },
  { slug: "perfect-days-2023", title: "Perfect Days", year: 2023, country: "JP", director: "Wim Wenders", genres: ["Drama"], motif: "🌳", synopsis: "A Tokyo toilet cleaner finds contentment in cassettes, books and the light through the trees." },
  // 🇮🇳 India
  { slug: "rrr-2022", title: "RRR", year: 2022, country: "IN", director: "S. S. Rajamouli", genres: ["Action", "History", "Musical"], motif: "🐅", synopsis: "Two revolutionaries on opposite sides become friends in 1920s colonial India." },
  { slug: "3-idiots-2009", title: "3 Idiots", year: 2009, country: "IN", director: "Rajkumar Hirani", genres: ["Comedy", "Drama"], motif: "🎓", synopsis: "Two friends search for the engineering-college classmate who taught them to chase excellence." },
  // 🌍 Beyond
  { slug: "crazy-rich-asians-2018", title: "Crazy Rich Asians", year: 2018, country: "US", director: "Jon M. Chu", genres: ["Romance", "Comedy"], motif: "💍", synopsis: "A New York professor visits her boyfriend's family in Singapore and learns how rich they are." },
];

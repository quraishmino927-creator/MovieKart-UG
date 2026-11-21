import { Movie, UserAccount } from '../types';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Who Killed Captain Alex?',
    genre: 'Ugandan Hits',
    year: 2024,
    duration: '1h 24m',
    rating: 0,
    ageRating: '16+',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Uganda’s legendary action spectacle! Kampala’s most fearless commando sets out to capture the notorious Tiger Mafia in an explosive showdown with non-stop kung-fu martial arts.',
    director: 'Nabwana I.G.G.',
    cast: ['Kakule William', 'Sserunya Ernest', 'Bukenya Charles'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    fileSizeMb: 420,
    isTrending: true,
    isFeatured: true,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj1',
        name: 'VJ Emmie',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Commandos! Danger in the city!',
          'Abaana ba Kampala, mwekuume tiger mafia!',
          'Bruce U in action! Action packed!',
          'Obusolo buno tebulyoka!'
        ]
      },
      {
        id: 'vj2',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: false,
        commentaryQuotes: [
          'Ensimbi ziri mu Kampala, laba bano!',
          'Ekintu kino kirimu essanyu!',
          'Abaana b’omukibuga!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Audio',
        language: 'English',
        isDefault: false,
        commentaryQuotes: ['[Standard Studio Audio Track]']
      }
    ]
  },
  {
    id: 'm2',
    title: 'Tears of Steel: Neo-Kampala',
    genre: 'Sci-Fi',
    year: 2025,
    duration: '1h 52m',
    rating: 0,
    ageRating: '16+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'In a dystopian future, a squad of resistance fighters with cybernetic augmentations scramble inside an old rocket silo to reverse a global artificial intelligence takeover.',
    director: 'Ian Hubert',
    cast: ['Derek de Lint', 'Sergio Hasselbaink', 'Rogier Schippers'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    fileSizeMb: 680,
    isTrending: true,
    isFeatured: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Abasajja ba robot bazze, tebasaaga!',
          'Laba tekinologiya ono ow’ekitalo!',
          'Ky’olina okulaba kiringa Hollywood naye nga waliwo essimu!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original English',
        language: 'English',
        commentaryQuotes: ['[Original Studio Sound]']
      }
    ]
  },
  {
    id: 'm3',
    title: 'Kampala Speed: Bodaboda Chase',
    genre: 'Action',
    year: 2024,
    duration: '1h 38m',
    rating: 0,
    ageRating: '16+',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A quick-witted Kampala bodaboda rider accidentally picks up a courier bag containing an encrypted diamond ledger, triggering a wild pursuit across Nakasero and Old Taxi Park.',
    director: 'Kizito Samuel',
    cast: ['Okello Denis', 'Namugga Grace', 'Ssenyonjo Peter'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    fileSizeMb: 510,
    isTrending: true,
    isFeatured: false,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Boda boda ey’akabi! Vuma omuliro!',
          'Old Taxi Park tebasaagiramu!',
          'Laba speed gye baddusako!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Audio',
        language: 'Luganda / English',
        commentaryQuotes: ['[Original Sound]']
      }
    ]
  },
  {
    id: 'm4',
    title: 'Big Buck Bunny: Forest Rumble',
    genre: 'Comedy',
    year: 2023,
    duration: '1h 15m',
    rating: 0,
    ageRating: 'PG',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A gentle giant rabbit decides he has had enough of three bully forest rodents who pick on innocent creatures, hatching an ingenious cartoon trap filled with laughs.',
    director: 'Sacha Goedegebure',
    cast: ['Animated Cast'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileSizeMb: 360,
    isTrending: true,
    isFeatured: false,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-emmy',
        name: 'VJ Emmy',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Akasungisungi kano kajjudde obukodyo!',
          'Laba bano bwe banoonya akabasaanya!',
          'Kata kano ka comedy ka buli muntu!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Audio',
        language: 'English',
        commentaryQuotes: ['[Sound Effects & Orchestra]']
      }
    ]
  },
  {
    id: 'm5',
    title: 'The Pearl Horizon',
    genre: 'Drama',
    year: 2024,
    duration: '2h 10m',
    rating: 0,
    ageRating: '13+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A heartfelt journey of an ambitious young coffee farmer in the Rwenzori mountains fighting climate shifts and international commodity cartels to empower his community.',
    director: 'Nalubega Proscovia',
    cast: ['Bwambale Rogers', 'Mbabazi Fiona', 'Tumusiime John'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    fileSizeMb: 590,
    isTrending: false,
    isFeatured: true,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jingo',
        name: 'VJ Jingo',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Ensi eno erimu obugagga bungi!',
          'Okusoma n’okola ennyo kye kiyamba!',
          'Olugero luno lukwata ku buli muntu.'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Sound',
        language: 'Luganda / English',
        commentaryQuotes: ['[Dolby Atmos 5.1]']
      }
    ]
  },
  {
    id: 'm6',
    title: 'Sintel: Fire Dragon Quest',
    genre: 'Sci-Fi',
    year: 2023,
    duration: '1h 32m',
    rating: 0,
    ageRating: '13+',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A lonely young warrior nurses a wounded baby dragon back to health. When a ferocious adult dragon carries it away, she braves treacherous peaks and bandits across frozen badlands.',
    director: 'Colin Levy',
    cast: ['Halina Reijn', 'Thom Hoffman'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    fileSizeMb: 490,
    isTrending: true,
    isFeatured: false,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-junior',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Omukazi ono alina amaanyi g’omutima!',
          'Omuliro guvuddemu! Dragon ye!',
          'Ggwe laba olugendo lw’amaziga!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Audio',
        language: 'English',
        commentaryQuotes: ['[Original Audio]']
      }
    ]
  },
  {
    id: 'm7',
    title: 'The Matooke Heist',
    genre: 'Comedy',
    year: 2024,
    duration: '1h 28m',
    rating: 0,
    ageRating: 'PG',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Two bumbling cousins from Masaka concoct a hilarious scheme to transport fifty prize-winning bunches of rare highland matooke into a wedding banquet in Entebbe.',
    director: 'Ssenkungu David',
    cast: ['Muwonge Patrick', 'Kabagambe Robert', 'Namutebi Sarah'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    fileSizeMb: 390,
    isTrending: false,
    isFeatured: false,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-emmy',
        name: 'VJ Emmy',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Kino kisse abantu n’enseko!',
          'Matooke ge banoonya oba ensimbi?',
          'Mazima tebasaaga naye bakola busiru!'
        ]
      }
    ]
  },
  {
    id: 'm8',
    title: 'Midnight at Lake Victoria',
    genre: 'Thriller',
    year: 2025,
    duration: '1h 45m',
    rating: 0,
    ageRating: '16+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A marine investigator searching for an abandoned cargo vessel on the misty waters of Lake Victoria uncovers a clandestine gold transport ring protected by corrupt mercenaries.',
    director: 'Lubwama Raymond',
    cast: ['Ochieng Moses', 'Katusiime Gloria', 'Wasswa Brian'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    fileSizeMb: 530,
    isTrending: true,
    isFeatured: false,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Ennyanja Victoria tejjudde byabulijjo!',
          'Ebizibu binywezezza omusajja ono!',
          'Watch out behind you!'
        ]
      }
    ]
  },
  {
    id: 'm9',
    title: 'Elephants Dream: Wireframe Void',
    genre: 'Sci-Fi',
    year: 2023,
    duration: '1h 22m',
    rating: 0,
    ageRating: '13+',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Two travelers wander through the labyrinth of a giant, bizarre machine that embodies mechanical thoughts, reality distortions, and ancient computing nodes.',
    director: 'Bassam Kurdali',
    cast: ['Tygo Gernandt', 'Cas Jansen'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    fileSizeMb: 450,
    isTrending: false,
    isFeatured: false,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Mashini ziri mu mutwe gw’omaze!',
          'Tekinologiya w’ebiro eby’omu maaso!'
        ]
      }
    ]
  },
  {
    id: 'm10',
    title: 'The Girl in the Yellow Jumper',
    genre: 'Ugandan Hits',
    year: 2024,
    duration: '1h 55m',
    rating: 0,
    ageRating: '18+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A man returns from a remote northern Ugandan border town after surviving an abduction, but his tale unravels when detectives realize the hostage in the yellow jumper may not exist.',
    director: 'Loukman Ali',
    cast: ['Michael Wawuyo Jr.', 'Gladys Oyenbot', 'Maurice Kirya'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    fileSizeMb: 610,
    isTrending: true,
    isFeatured: true,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Loukman Ali ataddemu omuliro guno!',
          'Omukazi ali mu kyenvu bamunoonya!',
          'Mystery ya kabi nnyo!'
        ]
      },
      {
        id: 'vj-orig',
        name: 'Original Audio',
        language: 'English',
        commentaryQuotes: ['[Original Studio Sound]']
      }
    ]
  },
  {
    id: 'm11',
    title: 'Shadow Strike: Special Squad',
    genre: 'Action',
    year: 2025,
    duration: '2h 04m',
    rating: 0,
    ageRating: '16+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'When an international black-market cartel takes over an offshore rig, an elite East African tactical squad executes a night insertion to disarm a biological weapon.',
    director: 'Kalyango Eric',
    cast: ['Semakula Joseph', 'Akello Sandra', 'Mugerwa Davis'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    fileSizeMb: 640,
    isTrending: true,
    isFeatured: false,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Tactical entry! Tebasaaga bano!',
          'Boom! Bomu egudde!',
          'Laba sniper bw’akubye!'
        ]
      }
    ]
  },
  {
    id: 'm12',
    title: 'Kampala Laugh Night Live',
    genre: 'Comedy',
    year: 2024,
    duration: '1h 35m',
    rating: 0,
    ageRating: 'PG',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'The best stand-up comedy specials directly from National Theatre in Kampala, featuring hilarious takes on commuter taxis, wedding pledges, and modern dating.',
    director: 'Mukiibi Allan',
    cast: ['Salvado Patrick', 'Teacher Mpamire', 'Madrat & Chico'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileSizeMb: 410,
    isTrending: false,
    isFeatured: false,
    isUgandanExclusive: true,
    viewsCount: 0,
    vjTracks: [
      {
        id: 'vj-emmy',
        name: 'VJ Emmy',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: ['Enseko zokka zokka!', 'Kampala oyee!']
      }
    ]
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u1',
    name: 'Kato Joseph',
    email: 'kato.joseph@ugmail.com',
    phone: '+256 772 491023',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    subscription: 'MovieKart VIP',
    status: 'active',
    joinedDate: 'Jan 12, 2025',
    momoProvider: 'MTN Mobile Money',
    storageUsedMb: 1420,
    downloadsCount: 3
  },
  {
    id: 'u2',
    name: 'Nakato Sarah',
    email: 'sarah.nakato@kampala.org',
    phone: '+256 701 883921',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    subscription: 'MovieKart VIP',
    status: 'active',
    joinedDate: 'Feb 03, 2025',
    momoProvider: 'Airtel Money',
    storageUsedMb: 2100,
    downloadsCount: 4
  },
  {
    id: 'u3',
    name: 'Mugisha Brian',
    email: 'brian.mugisha@gmail.com',
    phone: '+256 788 120934',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    subscription: 'Standard HD',
    status: 'active',
    joinedDate: 'Mar 15, 2025',
    momoProvider: 'MTN Mobile Money',
    storageUsedMb: 680,
    downloadsCount: 1
  },
  {
    id: 'u4',
    name: 'Atuhaire Brenda',
    email: 'brenda.atuhaire@yahoo.com',
    phone: '+256 752 901144',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    subscription: 'Free Pass',
    status: 'suspended',
    joinedDate: 'Apr 02, 2025',
    momoProvider: 'Airtel Money',
    storageUsedMb: 0,
    downloadsCount: 0
  }
];

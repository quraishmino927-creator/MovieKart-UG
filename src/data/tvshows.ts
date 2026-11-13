import { TVShow } from '../types';

export const INITIAL_TV_SHOWS: TVShow[] = [
  {
    id: 'tv1',
    title: 'Kampala Hustle: The Series',
    genre: 'Ugandan Hits',
    year: 2024,
    rating: 9.3,
    ageRating: '16+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Kampala’s gritty underworld meets high-stakes corporate power. A young courier in downtown Kampala finds himself caught in a turf war between rival syndicates operating out of Nakasero.',
    creator: 'Kizito Samuel & Nabwana I.G.G.',
    cast: ['Okello Denis', 'Namugga Grace', 'Ssenyonjo Peter', 'Nalubega Fiona'],
    isTrending: true,
    isFeatured: true,
    isUgandanExclusive: true,
    viewsCount: 215400,
    vjTracks: [
      {
        id: 'vj1',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: [
          'Abaana b’omukibuga tebasaaga!',
          'Ensimbi ziri mu Kampala!',
          'Laba speed gy’adduka!'
        ]
      },
      {
        id: 'vj2',
        name: 'Original Audio',
        language: 'Luganda / English',
        isDefault: false,
        commentaryQuotes: ['[Original Studio Sound]']
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tv1_s1_e1',
            episodeNumber: 1,
            title: 'Pilot: The Nakasero Drop',
            duration: '45m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'Denis takes on what should have been a standard package delivery across the city, only to discover encrypted ledger keys that everyone wants.',
            fileSizeMb: 240
          },
          {
            id: 'tv1_s1_e2',
            episodeNumber: 2,
            title: 'Episode 2: Old Taxi Park Trap',
            duration: '42m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            synopsis: 'Cornered amidst hundreds of commuter taxis, Denis must rely on fellow bodaboda riders to execute a daring escape.',
            fileSizeMb: 225
          },
          {
            id: 'tv1_s1_e3',
            episodeNumber: 3,
            title: 'Episode 3: Midnight at Ggaba Landing',
            duration: '48m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            synopsis: 'A clandestine boat meetup on Lake Victoria turns into an ambush when undercover detectives crash the cargo exchange.',
            fileSizeMb: 260
          },
          {
            id: 'tv1_s1_e4',
            episodeNumber: 4,
            title: 'Episode 4: The Kololo Syndicate',
            duration: '50m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'The mastermind behind the ledger invites Denis to a lavish dinner in Kololo with an offer he cannot refuse.',
            fileSizeMb: 280
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2',
        episodes: [
          {
            id: 'tv1_s2_e1',
            episodeNumber: 1,
            title: 'Episode 1: Reckoning on Jinja Road',
            duration: '46m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
            synopsis: 'After six months laying low, an unexpected threat from an international cartel forces the squad back into action.',
            fileSizeMb: 250
          },
          {
            id: 'tv1_s2_e2',
            episodeNumber: 2,
            title: 'Episode 2: The Entebbe Manifest',
            duration: '44m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
            synopsis: 'A private jet lands at Entebbe with a shipment that could compromise Uganda’s telecom infrastructure.',
            fileSizeMb: 235
          },
          {
            id: 'tv1_s2_e3',
            episodeNumber: 3,
            title: 'Episode 3: The Diamond Heist Finale',
            duration: '52m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'All alliances shatter in an explosive climax on the rooftops of Kampala.',
            fileSizeMb: 290
          }
        ]
      }
    ]
  },
  {
    id: 'tv2',
    title: 'Wakaliwood Commandos',
    genre: 'Action',
    year: 2024,
    rating: 9.1,
    ageRating: '16+',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Uganda’s fiercest commando trainees face impossible odds as they defend their village from rogue militia operatives in kung-fu combat.',
    creator: 'Nabwana I.G.G.',
    cast: ['Kakule William', 'Sserunya Ernest', 'Bukenya Charles'],
    isTrending: true,
    isFeatured: true,
    isUgandanExclusive: true,
    viewsCount: 184000,
    vjTracks: [
      {
        id: 'vj_emmie',
        name: 'VJ Emmie',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: ['Bruce U in action!', 'Action packed! Commandos!']
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tv2_s1_e1',
            episodeNumber: 1,
            title: 'Episode 1: Enter Bruce U',
            duration: '32m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'A martial arts prodigy arrives at the commando camp, ready to showcase gravity-defying kung-fu kicks.',
            fileSizeMb: 180
          },
          {
            id: 'tv2_s1_e2',
            episodeNumber: 2,
            title: 'Episode 2: Tiger Mafia Strikes',
            duration: '34m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            synopsis: 'The evil syndicate launches a surprise raid on the base with homemade smoke bombs and heavy artillery.',
            fileSizeMb: 195
          },
          {
            id: 'tv2_s1_e3',
            episodeNumber: 3,
            title: 'Episode 3: Helicopter Showdown',
            duration: '36m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            synopsis: 'The commandos take down an enemy gunship in a high-octane aerial dogfight over Wakaliga.',
            fileSizeMb: 210
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2',
        episodes: [
          {
            id: 'tv2_s2_e1',
            episodeNumber: 1,
            title: 'Episode 1: Shadows Over Kampala',
            duration: '35m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'New threats emerge as the Tiger Mafia joins forces with international mercenaries.',
            fileSizeMb: 190
          },
          {
            id: 'tv2_s2_e2',
            episodeNumber: 2,
            title: 'Episode 2: Ultimate Kung-Fu Clash',
            duration: '38m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            synopsis: 'The season finale tournament where only one master warrior will stand victorious.',
            fileSizeMb: 220
          }
        ]
      }
    ]
  },
  {
    id: 'tv3',
    title: 'Cyber Void 2099',
    genre: 'Sci-Fi',
    year: 2025,
    rating: 8.9,
    ageRating: '16+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'In an augmented futuristic metropolis, rebel hackers battle a hyper-intelligent AI entity that monitors citizen neural implants.',
    creator: 'Loukman Ali',
    cast: ['Maurice Kirya', 'Gladys Oyenbot', 'Michael Wawuyo Jr.'],
    isTrending: true,
    isFeatured: false,
    viewsCount: 96200,
    vjTracks: [
      {
        id: 'vj_jun',
        name: 'VJ Junior',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: ['Tekinologiya ow’ekitalo!', 'Robot zino zitta abantu!']
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tv3_s1_e1',
            episodeNumber: 1,
            title: 'Episode 1: Protocol Zero',
            duration: '44m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            synopsis: 'Hacker Zero discovers anomalous code propagating across public power grids.',
            fileSizeMb: 245
          },
          {
            id: 'tv3_s1_e2',
            episodeNumber: 2,
            title: 'Episode 2: Neural Net Breach',
            duration: '46m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            synopsis: 'A dive inside the mainframe threatens to disconnect Zero’s consciousness permanently.',
            fileSizeMb: 255
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2',
        episodes: [
          {
            id: 'tv3_s2_e1',
            episodeNumber: 1,
            title: 'Episode 1: Orbital Beacon',
            duration: '45m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            synopsis: 'A deep space transmitter responds to the cyber core signals.',
            fileSizeMb: 250
          }
        ]
      }
    ]
  },
  {
    id: 'tv4',
    title: 'Boda Boda Diaries',
    genre: 'Comedy',
    year: 2024,
    rating: 8.8,
    ageRating: 'PG',
    quality: '1080p FHD',
    posterUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'The hilarious daily misadventures of three cheerful bodaboda riders ferrying quirky tourists, musicians, and bridegrooms across the hills of Kampala.',
    creator: 'Mukiibi Allan',
    cast: ['Muwonge Patrick', 'Kabagambe Robert', 'Namutebi Sarah'],
    isTrending: false,
    isFeatured: false,
    isUgandanExclusive: true,
    viewsCount: 114500,
    vjTracks: [
      {
        id: 'vj_emmy',
        name: 'VJ Emmy',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: ['Enseko zokka zokka!', 'Boda boda eno ya kabi!']
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tv4_s1_e1',
            episodeNumber: 1,
            title: 'Episode 1: The VIP Passenger',
            duration: '28m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            synopsis: 'Patrick picks up an eccentric millionaire with a pet goat who insists on taking the scenic route.',
            fileSizeMb: 150
          },
          {
            id: 'tv4_s1_e2',
            episodeNumber: 2,
            title: 'Episode 2: Lost in Wandegeya',
            duration: '26m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
            synopsis: 'A shortcut through university halls ends up at a student flash-mob parade.',
            fileSizeMb: 140
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2',
        episodes: [
          {
            id: 'tv4_s2_e1',
            episodeNumber: 1,
            title: 'Episode 1: The Electric Bike',
            duration: '27m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            synopsis: 'The crew upgrades to solar electric bikes, but nobody read the battery instructions.',
            fileSizeMb: 145
          }
        ]
      }
    ]
  },
  {
    id: 'tv5',
    title: 'The Pearl Horizon: Chronicles',
    genre: 'Drama',
    year: 2024,
    rating: 9.0,
    ageRating: '13+',
    quality: '4K UHD',
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A multi-generational saga centered on three families running premier agricultural and wildlife conservation reserves along the River Nile.',
    creator: 'Nalubega Proscovia',
    cast: ['Bwambale Rogers', 'Mbabazi Fiona', 'Tumusiime John'],
    isTrending: false,
    isFeatured: false,
    isUgandanExclusive: true,
    viewsCount: 78900,
    vjTracks: [
      {
        id: 'vj_jingo',
        name: 'VJ Jingo',
        language: 'Luganda',
        isDefault: true,
        commentaryQuotes: ['Olugero luno lukwata ku buli muntu.', 'Ensi erimu obugagga!']
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tv5_s1_e1',
            episodeNumber: 1,
            title: 'Episode 1: River of Dreams',
            duration: '42m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
            synopsis: 'The founding harvest brings unexpected competition from international commodity dealers.',
            fileSizeMb: 230
          },
          {
            id: 'tv5_s1_e2',
            episodeNumber: 2,
            title: 'Episode 2: Whispers in Jinja',
            duration: '45m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            synopsis: 'Fiona uncovers water diversion permits that threaten local downstream villages.',
            fileSizeMb: 240
          }
        ]
      }
    ]
  }
];

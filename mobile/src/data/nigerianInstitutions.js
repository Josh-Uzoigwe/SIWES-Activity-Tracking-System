/**
 * Comprehensive National Directory of Accredited Nigerian Tertiary Institutions
 * Categorized by Country, State, and Institution Type (Federal/State Universities, Polytechnics)
 */

export const COUNTRIES = ['Nigeria', 'Other / International'];

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export const INSTITUTION_CATEGORIES = [
  'Federal University',
  'State University',
  'Federal Polytechnic',
  'State Polytechnic',
  'Private University / College'
];

export const ACCREDITED_INSTITUTIONS = [
  // Kwara
  { name: 'University of Ilorin', code: 'UNILORIN', state: 'Kwara', category: 'Federal University', domain: 'unilorin.edu.ng' },
  { name: 'Kwara State University', code: 'KWASU', state: 'Kwara', category: 'State University', domain: 'kwasu.edu.ng' },
  { name: 'Federal Polytechnic, Offa', code: 'FEDPOFFA', state: 'Kwara', category: 'Federal Polytechnic', domain: 'fpo.edu.ng' },
  { name: 'Kwara State Polytechnic', code: 'KWARAPOLY', state: 'Kwara', category: 'State Polytechnic', domain: 'kwarastatepolytechnic.edu.ng' },

  // Lagos
  { name: 'University of Lagos', code: 'UNILAG', state: 'Lagos', category: 'Federal University', domain: 'unilag.edu.ng' },
  { name: 'Lagos State University', code: 'LASU', state: 'Lagos', category: 'State University', domain: 'lasu.edu.ng' },
  { name: 'Lagos State University of Science and Technology', code: 'LASUSTECH', state: 'Lagos', category: 'State University', domain: 'lasustech.edu.ng' },
  { name: 'Lagos State University of Education', code: 'LASUED', state: 'Lagos', category: 'State University', domain: 'lasued.edu.ng' },
  { name: 'Yaba College of Technology', code: 'YABATECH', state: 'Lagos', category: 'Federal Polytechnic', domain: 'yabatech.edu.ng' },
  { name: 'Pan-Atlantic University', code: 'PAU', state: 'Lagos', category: 'Private University / College', domain: 'pau.edu.ng' },

  // Oyo
  { name: 'University of Ibadan', code: 'UI', state: 'Oyo', category: 'Federal University', domain: 'ui.edu.ng' },
  { name: 'Ladoke Akintola University of Technology', code: 'LAUTECH', state: 'Oyo', category: 'State University', domain: 'lautech.edu.ng' },
  { name: 'First Technical University, Ibadan', code: 'TECH-U', state: 'Oyo', category: 'State University', domain: 'tech-u.edu.ng' },
  { name: 'The Polytechnic, Ibadan', code: 'POLYIBADAN', state: 'Oyo', category: 'State Polytechnic', domain: 'polyibadan.edu.ng' },
  { name: 'Federal College of Animal Health and Production Technology', code: 'FCAHPT', state: 'Oyo', category: 'Federal Polytechnic', domain: 'fcahpt.edu.ng' },

  // Osun
  { name: 'Obafemi Awolowo University', code: 'OAU', state: 'Osun', category: 'Federal University', domain: 'oauife.edu.ng' },
  { name: 'Osun State University', code: 'UNIOSUN', state: 'Osun', category: 'State University', domain: 'uniosun.edu.ng' },
  { name: 'Federal Polytechnic, Ede', code: 'FEDPEDE', state: 'Osun', category: 'Federal Polytechnic', domain: 'federalpolyede.edu.ng' },
  { name: 'Osun State Polytechnic, Iree', code: 'OSUNPOLY', state: 'Osun', category: 'State Polytechnic', domain: 'ospoly.edu.ng' },

  // Ogun
  { name: 'Federal University of Agriculture, Abeokuta', code: 'FUNAAB', state: 'Ogun', category: 'Federal University', domain: 'funaab.edu.ng' },
  { name: 'Olabisi Onabanjo University', code: 'OOU', state: 'Ogun', category: 'State University', domain: 'oouagoiwoye.edu.ng' },
  { name: 'Tai Solarin University of Education', code: 'TASUED', state: 'Ogun', category: 'State University', domain: 'tasued.edu.ng' },
  { name: 'Federal Polytechnic, Ilaro', code: 'ILAPOLY', state: 'Ogun', category: 'Federal Polytechnic', domain: 'federalpolyilaro.edu.ng' },
  { name: 'Moshood Abiola Polytechnic', code: 'MAPOLY', state: 'Ogun', category: 'State Polytechnic', domain: 'mapoly.edu.ng' },
  { name: 'Covenant University', code: 'CU', state: 'Ogun', category: 'Private University / College', domain: 'covenantuniversity.edu.ng' },
  { name: 'Babcock University', code: 'BABCOCK', state: 'Ogun', category: 'Private University / College', domain: 'babcock.edu.ng' },

  // Ondo
  { name: 'Federal University of Technology, Akure', code: 'FUTA', state: 'Ondo', category: 'Federal University', domain: 'futa.edu.ng' },
  { name: 'Adekunle Ajasin University', code: 'AAUA', state: 'Ondo', category: 'State University', domain: 'aaua.edu.ng' },
  { name: 'Olusegun Agagu University of Science and Technology', code: 'OAUSTECH', state: 'Ondo', category: 'State University', domain: 'oaustech.edu.ng' },
  { name: 'Rufus Giwa Polytechnic', code: 'RUGIPO', state: 'Ondo', category: 'State Polytechnic', domain: 'rugipo.edu.ng' },
  { name: 'Federal Polytechnic, Ile-Oluji', code: 'FEDPOLEL', state: 'Ondo', category: 'Federal Polytechnic', domain: 'fedpolel.edu.ng' },

  // Ekiti
  { name: 'Federal University, Oye-Ekiti', code: 'FUOYE', state: 'Ekiti', category: 'Federal University', domain: 'fuoye.edu.ng' },
  { name: 'Ekiti State University', code: 'EKSU', state: 'Ekiti', category: 'State University', domain: 'eksu.edu.ng' },
  { name: 'Federal Polytechnic, Ado-Ekiti', code: 'FEDPOLYADO', state: 'Ekiti', category: 'Federal Polytechnic', domain: 'fedpolyado.edu.ng' },

  // FCT - Abuja
  { name: 'University of Abuja', code: 'UNIABUJA', state: 'FCT - Abuja', category: 'Federal University', domain: 'uniabuja.edu.ng' },
  { name: 'Nile University of Nigeria', code: 'NILE', state: 'FCT - Abuja', category: 'Private University / College', domain: 'nileuniversity.edu.ng' },
  { name: 'Baze University', code: 'BAZE', state: 'FCT - Abuja', category: 'Private University / College', domain: 'bazeuniversity.edu.ng' },

  // Enugu
  { name: 'University of Nigeria, Nsukka', code: 'UNN', state: 'Enugu', category: 'Federal University', domain: 'unn.edu.ng' },
  { name: 'Enugu State University of Science and Technology', code: 'ESUT', state: 'Enugu', category: 'State University', domain: 'esut.edu.ng' },
  { name: 'Institute of Management and Technology, Enugu', code: 'IMT', state: 'Enugu', category: 'State Polytechnic', domain: 'imt.edu.ng' },
  { name: 'Federal College of Dental Technology and Therapy', code: 'FEDCODTT', state: 'Enugu', category: 'Federal Polytechnic', domain: 'fedcodttenugu.edu.ng' },

  // Anambra
  { name: 'Nnamdi Azikiwe University', code: 'UNIZIK', state: 'Anambra', category: 'Federal University', domain: 'unizik.edu.ng' },
  { name: 'Chukwuemeka Odumegwu Ojukwu University', code: 'COOU', state: 'Anambra', category: 'State University', domain: 'coou.edu.ng' },
  { name: 'Federal Polytechnic, Oko', code: 'OKOPOLY', state: 'Anambra', category: 'Federal Polytechnic', domain: 'federalpolyoko.edu.ng' },

  // Imo
  { name: 'Federal University of Technology, Owerri', code: 'FUTO', state: 'Imo', category: 'Federal University', domain: 'futo.edu.ng' },
  { name: 'Imo State University', code: 'IMSU', state: 'Imo', category: 'State University', domain: 'imsu.edu.ng' },
  { name: 'Federal Polytechnic, Nekede', code: 'NEKEDEPOLY', state: 'Imo', category: 'Federal Polytechnic', domain: 'fpno.edu.ng' },

  // Abia
  { name: 'Michael Okpara University of Agriculture, Umudike', code: 'MOUAU', state: 'Abia', category: 'Federal University', domain: 'mouau.edu.ng' },
  { name: 'Abia State University', code: 'ABSU', state: 'Abia', category: 'State University', domain: 'abiastateuniversity.edu.ng' },
  { name: 'Abia State Polytechnic', code: 'ABIAPOLY', state: 'Abia', category: 'State Polytechnic', domain: 'abiastatepolytechnic.edu.ng' },

  // Rivers
  { name: 'University of Port Harcourt', code: 'UNIPORT', state: 'Rivers', category: 'Federal University', domain: 'uniport.edu.ng' },
  { name: 'Rivers State University', code: 'RSU', state: 'Rivers', category: 'State University', domain: 'rsu.edu.ng' },
  { name: 'Captain Elechi Amadi Polytechnic', code: 'PORTPOLY', state: 'Rivers', category: 'State Polytechnic', domain: 'portharcourtpoly.edu.ng' },
  { name: 'Federal Polytechnic of Oil and Gas, Bonny', code: 'FPOGB', state: 'Rivers', category: 'Federal Polytechnic', domain: 'fedpolybonny.edu.ng' },

  // Delta
  { name: 'Federal University of Petroleum Resources, Effurun', code: 'FUPRE', state: 'Delta', category: 'Federal University', domain: 'fupre.edu.ng' },
  { name: 'Delta State University, Abraka', code: 'DELSU', state: 'Delta', category: 'State University', domain: 'delsu.edu.ng' },
  { name: 'University of Delta, Agbor', code: 'UNIDEL', state: 'Delta', category: 'State University', domain: 'unidel.edu.ng' },
  { name: 'Delta State Polytechnic, Ogwashi-Uku', code: 'DSPG', state: 'Delta', category: 'State Polytechnic', domain: 'mydspg.edu.ng' },
  { name: 'Delta State Polytechnic, Otefe-Oghara', code: 'DESPO', state: 'Delta', category: 'State Polytechnic', domain: 'ogharapoly.edu.ng' },

  // Edo
  { name: 'University of Benin', code: 'UNIBEN', state: 'Edo', category: 'Federal University', domain: 'uniben.edu' },
  { name: 'Ambrose Alli University', code: 'AAU', state: 'Edo', category: 'State University', domain: 'aauekpoma.edu.ng' },
  { name: 'Edo State University, Uzairue', code: 'EDSU', state: 'Edo', category: 'State University', domain: 'edouniversity.edu.ng' },
  { name: 'Federal Polytechnic, Auchi', code: 'AUCHIPOLY', state: 'Edo', category: 'Federal Polytechnic', domain: 'auchipoly.edu.ng' },

  // Kaduna
  { name: 'Ahmadu Bello University', code: 'ABU', state: 'Kaduna', category: 'Federal University', domain: 'abu.edu.ng' },
  { name: 'Kaduna State University', code: 'KASU', state: 'Kaduna', category: 'State University', domain: 'kasu.edu.ng' },
  { name: 'Air Force Institute of Technology', code: 'AFIT', state: 'Kaduna', category: 'Federal University', domain: 'afit.edu.ng' },
  { name: 'Kaduna Polytechnic', code: 'KADPOLY', state: 'Kaduna', category: 'Federal Polytechnic', domain: 'kadpoly.edu.ng' },
  { name: 'Nuhu Bamalli Polytechnic, Zaria', code: 'NUBAPOLY', state: 'Kaduna', category: 'State Polytechnic', domain: 'nubapoly.edu.ng' },

  // Kano
  { name: 'Bayero University Kano', code: 'BUK', state: 'Kano', category: 'Federal University', domain: 'buk.edu.ng' },
  { name: 'Aliko Dangote University of Science and Technology, Wudil', code: 'ADUSTECH', state: 'Kano', category: 'State University', domain: 'adustech.edu.ng' },
  { name: 'Yusuf Maitama Sule University, Kano', code: 'YUMSUK', state: 'Kano', category: 'State University', domain: 'yumsuk.edu.ng' },
  { name: 'Kano State Polytechnic', code: 'KANOPOLY', state: 'Kano', category: 'State Polytechnic', domain: 'kanopoly.edu.ng' },

  // Plateau
  { name: 'University of Jos', code: 'UNIJOS', state: 'Plateau', category: 'Federal University', domain: 'unijos.edu.ng' },
  { name: 'Plateau State University, Bokkos', code: 'PLASU', state: 'Plateau', category: 'State University', domain: 'plasu.edu.ng' },
  { name: 'Plateau State Polytechnic, Barkin Ladi', code: 'PLAPOLY', state: 'Plateau', category: 'State Polytechnic', domain: 'plapoly.edu.ng' },

  // Niger
  { name: 'Federal University of Technology, Minna', code: 'FUTMINNA', state: 'Niger', category: 'Federal University', domain: 'futminna.edu.ng' },
  { name: 'Ibrahim Badamasi Babangida University, Lapai', code: 'IBBU', state: 'Niger', category: 'State University', domain: 'ibbu.edu.ng' },
  { name: 'Federal Polytechnic, Bida', code: 'FEDPOBIDA', state: 'Niger', category: 'Federal Polytechnic', domain: 'fedpolybida.edu.ng' },

  // Cross River
  { name: 'University of Calabar', code: 'UNICAL', state: 'Cross River', category: 'Federal University', domain: 'unical.edu.ng' },
  { name: 'University of Cross River State', code: 'UNICROSS', state: 'Cross River', category: 'State University', domain: 'unicross.edu.ng' },

  // Akwa Ibom
  { name: 'University of Uyo', code: 'UNIUYO', state: 'Akwa Ibom', category: 'Federal University', domain: 'uniuyo.edu.ng' },
  { name: 'Akwa Ibom State University', code: 'AKSU', state: 'Akwa Ibom', category: 'State University', domain: 'aksu.edu.ng' },
  { name: 'Federal Polytechnic, Ukana', code: 'FEDPOUKANA', state: 'Akwa Ibom', category: 'Federal Polytechnic', domain: 'fedpolyukana.edu.ng' },

  // Benue
  { name: 'Federal University of Agriculture, Makurdi', code: 'FUAM', state: 'Benue', category: 'Federal University', domain: 'uam.edu.ng' },
  { name: 'Benue State University, Makurdi', code: 'BSUM', state: 'Benue', category: 'State University', domain: 'bsum.edu.ng' },
  { name: 'Federal Polytechnic, Wannune', code: 'FPW', state: 'Benue', category: 'Federal Polytechnic', domain: 'fpw.edu.ng' },

  // Kogi
  { name: 'Federal University, Lokoja', code: 'FULOKOJA', state: 'Kogi', category: 'Federal University', domain: 'fulokoja.edu.ng' },
  { name: 'Prince Abubakar Audu University', code: 'PAAU', state: 'Kogi', category: 'State University', domain: 'paau.edu.ng' },
  { name: 'Confluence University of Science and Technology', code: 'CUSTECH', state: 'Kogi', category: 'State University', domain: 'custech.edu.ng' },
  { name: 'Federal Polytechnic, Idah', code: 'FPI', state: 'Kogi', category: 'Federal Polytechnic', domain: 'fpi.edu.ng' },

  // Borno
  { name: 'University of Maiduguri', code: 'UNIMAID', state: 'Borno', category: 'Federal University', domain: 'unimaid.edu.ng' },
  { name: 'Borno State University', code: 'BOSU', state: 'Borno', category: 'State University', domain: 'bosu.edu.ng' },
  { name: 'Ramat Polytechnic, Maiduguri', code: 'RAMATPOLY', state: 'Borno', category: 'State Polytechnic', domain: 'ramatpoly.edu.ng' },

  // Bauchi
  { name: 'Abubakar Tafawa Balewa University', code: 'ATBU', state: 'Bauchi', category: 'Federal University', domain: 'atbu.edu.ng' },
  { name: 'Bauchi State University, Gadau', code: 'BASUG', state: 'Bauchi', category: 'State University', domain: 'basug.edu.ng' },
  { name: 'Federal Polytechnic, Bauchi', code: 'FPTB', state: 'Bauchi', category: 'Federal Polytechnic', domain: 'fptb.edu.ng' },

  // Katsina
  { name: 'Federal University, Dutsin-Ma', code: 'FUDMA', state: 'Katsina', category: 'Federal University', domain: 'fudma.edu.ng' },
  { name: 'Umaru Musa Yar\'adua University', code: 'UMYU', state: 'Katsina', category: 'State University', domain: 'umyu.edu.ng' },
  { name: 'Hassan Usman Katsina Polytechnic', code: 'HUKPOLY', state: 'Katsina', category: 'State Polytechnic', domain: 'hukpoly.edu.ng' },

  // Sokoto
  { name: 'Usmanu Danfodiyo University', code: 'UDUS', state: 'Sokoto', category: 'Federal University', domain: 'udusok.edu.ng' },
  { name: 'Sokoto State University', code: 'SSU', state: 'Sokoto', category: 'State University', domain: 'ssu.edu.ng' },
  { name: 'Umaru Ali Shinkafi Polytechnic, Sokoto', code: 'SOSPOLY', state: 'Sokoto', category: 'State Polytechnic', domain: 'sospoly.edu.ng' },

  // Adamawa
  { name: 'Modibbo Adama University, Yola', code: 'MAU', state: 'Adamawa', category: 'Federal University', domain: 'mau.edu.ng' },
  { name: 'Adamawa State University, Mubi', code: 'ADSU', state: 'Adamawa', category: 'State University', domain: 'adsu.edu.ng' },
  { name: 'Federal Polytechnic, Mubi', code: 'FPM', state: 'Adamawa', category: 'Federal Polytechnic', domain: 'fpm.edu.ng' },

  // Nasarawa
  { name: 'Federal University, Lafia', code: 'FULAFIA', state: 'Nasarawa', category: 'Federal University', domain: 'fulafia.edu.ng' },
  { name: 'Nasarawa State University, Keffi', code: 'NSUK', state: 'Nasarawa', category: 'State University', domain: 'nsuk.edu.ng' },
  { name: 'Federal Polytechnic, Nasarawa', code: 'FEDPONAS', state: 'Nasarawa', category: 'Federal Polytechnic', domain: 'fedpolynas.edu.ng' },

  // Ebonyi
  { name: 'Alex Ekwueme Federal University, Ndufu-Alike', code: 'AE-FUNAI', state: 'Ebonyi', category: 'Federal University', domain: 'funai.edu.ng' },
  { name: 'Ebonyi State University', code: 'EBSU', state: 'Ebonyi', category: 'State University', domain: 'ebsu.edu.ng' },
  { name: 'Akanu Ibiam Federal Polytechnic, Unwana', code: 'AIFPU', state: 'Ebonyi', category: 'Federal Polytechnic', domain: 'polyunwana.edu.ng' },

  // Bayelsa
  { name: 'Federal University, Otuoke', code: 'FUOTUOKE', state: 'Bayelsa', category: 'Federal University', domain: 'fuotuoke.edu.ng' },
  { name: 'Niger Delta University', code: 'NDU', state: 'Bayelsa', category: 'State University', domain: 'ndu.edu.ng' },
  { name: 'Federal Polytechnic, Ekowe', code: 'FEDPOEKO', state: 'Bayelsa', category: 'Federal Polytechnic', domain: 'federalpolyekowe.edu.ng' },

  // Kebbi
  { name: 'Federal University, Birnin Kebbi', code: 'FUBK', state: 'Kebbi', category: 'Federal University', domain: 'fubk.edu.ng' },
  { name: 'Kebbi State University of Science and Technology, Aliero', code: 'KSUSTA', state: 'Kebbi', category: 'State University', domain: 'ksusta.edu.ng' },
  { name: 'Waziri Umaru Federal Polytechnic, Birnin Kebbi', code: 'WUFP', state: 'Kebbi', category: 'Federal Polytechnic', domain: 'wufpbk.edu.ng' },

  // Jigawa
  { name: 'Federal University, Dutse', code: 'FUD', state: 'Jigawa', category: 'Federal University', domain: 'fud.edu.ng' },
  { name: 'Sule Lamido University, Kafin Hausa', code: 'SLU', state: 'Jigawa', category: 'State University', domain: 'slu.edu.ng' },
  { name: 'Hussaini Adamu Federal Polytechnic, Kazaure', code: 'HAFEDPOLY', state: 'Jigawa', category: 'Federal Polytechnic', domain: 'hafedpoly.edu.ng' },

  // Gombe
  { name: 'Federal University, Kashere', code: 'FUKASHERE', state: 'Gombe', category: 'Federal University', domain: 'fukashere.edu.ng' },
  { name: 'Gombe State University', code: 'GSU', state: 'Gombe', category: 'State University', domain: 'gsu.edu.ng' },
  { name: 'Federal Polytechnic, Kaltungo', code: 'FPOK', state: 'Gombe', category: 'Federal Polytechnic', domain: 'fedpolykaltungo.edu.ng' },

  // Taraba
  { name: 'Federal University, Wukari', code: 'FUWUKARI', state: 'Taraba', category: 'Federal University', domain: 'fuwukari.edu.ng' },
  { name: 'Taraba State University, Jalingo', code: 'TSU', state: 'Taraba', category: 'State University', domain: 'tsuniversity.edu.ng' },
  { name: 'Federal Polytechnic, Bali', code: 'FEDBALI', state: 'Taraba', category: 'Federal Polytechnic', domain: 'fedpolybali.edu.ng' },

  // Yobe
  { name: 'Federal University, Gashua', code: 'FUGASHUA', state: 'Yobe', category: 'Federal University', domain: 'fugashua.edu.ng' },
  { name: 'Yobe State University, Damaturu', code: 'YSU', state: 'Yobe', category: 'State University', domain: 'ysu.edu.ng' },
  { name: 'Federal Polytechnic, Damaturu', code: 'FEDPODAM', state: 'Yobe', category: 'Federal Polytechnic', domain: 'fedpodam.edu.ng' },

  // Zamfara
  { name: 'Federal University, Gusau', code: 'FUGUS', state: 'Zamfara', category: 'Federal University', domain: 'fugusau.edu.ng' },
  { name: 'Zamfara State University', code: 'ZAMSU', state: 'Zamfara', category: 'State University', domain: 'zamsu.edu.ng' },
  { name: 'Federal Polytechnic, Kaura Namoda', code: 'FEDPONAM', state: 'Zamfara', category: 'Federal Polytechnic', domain: 'fedponam.edu.ng' }
];

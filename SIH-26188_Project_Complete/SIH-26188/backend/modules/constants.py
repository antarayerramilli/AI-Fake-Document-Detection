# ========== NEPAL ==========
# Nepal has 77 districts (as of 2015 constitution)
VALID_NEPAL_DISTRICTS = set([
    "Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari", "Dhankuta", "Terhathum",
    "Sankhuwasabha", "Bhojpur", "Solukhumbu", "Khotang", "Okhaldhunga", "Udayapur", "Saptari",
    "Siraha", "Dhanusa", "Mahottari", "Sarlahi", "Sindhuli", "Ramechhap", "Dolakha", "Sindhupalchok",
    "Kavrepalanchok", "Lalitpur", "Kathmandu", "Bhaktapur", "Makwanpur", "Chitwan", "Nuwakot",
    "Rasuwa", "Dhading", "Gorkha", "Lamjung", "Tanahun", "Syangja", "Kaski", "Manang", "Mustang",
    "Myagdi", "Parbat", "Baglung", "Gulmi", "Palpa", "Nawalpur", "Rupandehi", "Kapilvastu",
    "Arghakhanchi", "Pyuthan", "Rolpa", "Eastern Rukum", "Banke", "Bardiya", "Surkhet", "Dailekh",
    "Jajarkot", "Dolpa", "Jumla", "Kalikot", "Mugu", "Humla", "Western Rukum", "Salyan", "Dang",
    "Banke", "Bardiya", "Kailali", "Kanchanpur", "Dadeldhura", "Baitadi", "Darchula", "Doti",
    "Achham", "Bajura", "Bajhang", "Dipayal Silgadhi", "Bhimdatta", "Waling", "Jaya Prithvi",
    "Malangwa", "Gaur", "Lahan", "Rajbiraj", "Siraha", "Inaruwa", "Dharan", "Itahari", "Birtamod",
    "Damak", "Bhadrapur", "Mechinagar", "Khandbari", "Bhojpur", "Phidim", "Myanglung",
    "Laligurans", "Kathmandu", "Lalitpur", "Bhaktapur", "Kirtipur", "Madhyapur Thimi",
    "Kageshwori Manohara", "Karyabinayak", "Shankharapur", "Nagarjun", "Dakshinkali",
    "Budhanilkantha", "Gokarneshwor", "Chandragiri", "Tokha", "Tarakeshwor", "Kageshwori",
    # Common aliases and major ones for demo
    "Kathmandu", "Bhaktapur", "Lalitpur", "Pokhara", "Birgunj", "Nepalgunj", "Dharan",
    "Bharatpur", "Janakpur", "Hetauda", "Butwal", "Dhangadhi", "Itahari", "Dharan",
])

# ========== BHUTAN ==========
# Bhutan has 20 dzongkhags
VALID_BHUTAN_DZONGKHAGS = set([
    "Bumthang", "Chukha", "Dagana", "Gasa", "Haa", "Lhuntse", "Mongar", "Paro",
    "Pema Gatshel", "Punakha", "Samdrup Jongkhar", "Samtse", "Sarpang", "Thimphu",
    "Trashigang", "Trashiyangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang",
    # Common aliases
    "Thimphu", "Paro", "Punakha", "Wangdue", "Trashigang", "Mongar", "Samtse",
    "Chukha", "Sarpang", "Tsirang", "Dagana", "Trongsa", "Bumthang", "Zhemgang",
    "Lhuntse", "Gasa", "Haa", "Pema Gatshel", "Samdrup Jongkhar", "Trashiyangtse",
])

# ========== INDIA ==========
# Major constituency codes for demo (50 major ones)
VALID_CONSTITUENCIES = set([
    "Delhi Sadar", "Mumbai South", "Mumbai North", "Bangalore North", "Bangalore South",
    "Chennai Central", "Chennai North", "Kolkata East", "Kolkata South", "Hyderabad",
    "Secunderabad", "Pune", "Ahmedabad East", "Ahmedabad West", "Surat", "Jaipur",
    "Jaipur Rural", "Lucknow", "Kanpur", "Varanasi", "Allahabad", "Patna Sahib",
    "Patna", "Ranchi", "Jamshedpur", "Bhubaneswar", "Cuttack", "Bhopal", "Indore",
    "Gwalior", "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Shimla", "Mandi",
    "Dehradun", "Haridwar", "Nainital", "Raipur", "Bilaspur", "Bhubaneswar", "Puri",
    "Guwahati", "Dispur", "Shillong", "Aizawl", "Imphal", "Kohima", "Itanagar",
    "Gangtok", "Panaji", "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur",
    "Madurai", "Coimbatore", "Salem", "Tiruchirappalli", "Vellore", "Visakhapatnam",
    "Vijayawada", "Guntur", "Nellore", "Tirupati", "Rajahmundry", "Warangal",
    "Karimnagar", "Nizamabad", "Mahbubnagar", "Khammam", "Nalgonda", "Medak",
    "Malkajgiri", "Secunderabad", "Hyderabad", "Chevella", "Mahbubabad", "Khammam",
])

# Mock blacklist database
BLACKLISTED_DOCS = set([
    "J1234567",
    "5555-12345678",
    "99999999999",
    "ABC7654321",
])

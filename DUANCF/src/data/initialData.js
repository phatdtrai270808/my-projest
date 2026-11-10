export const INITIAL_TABLES = [
  { id: 'T1', name: 'Bàn 1-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T2', name: 'Bàn 2-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T3', name: 'Bàn 3-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T4', name: 'Bàn 4-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T5', name: 'Bàn 5-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T6', name: 'Bàn 6-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'L1', name: 'Bàn 1-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L2', name: 'Bàn 2-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L3', name: 'Bàn 3-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L4', name: 'Bàn 4-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
];

export const INITIAL_STAFF = [
  { id: 'NV1', name: 'Tiến Phát', role: 'Quản lý', wagePerHour: 30000, hourlyRate: 30000 },
  { id: 'NV2', name: 'Ng Thư', role: 'Thu ngân', wagePerHour: 25000, hourlyRate: 25000 },
];

export const MENU_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: '✨' },
  { id: 'cafe', name: 'Cà Phê', icon: '☕' },
  { id: 'tea', name: 'Trà & Trà Sữa', icon: '🍵' },
  { id: 'drink', name: 'Nước Uống & Đá Xay', icon: '🥤' },
  { id: 'food', name: 'Đồ Ăn & Bánh', icon: '🥐' },
];

export const INITIAL_MENU = [
  // 1. Cà phê phin truyền thống & pha máy
  {
    id: 'CF1',
    name: 'Cà Phê Đen Đá',
    price: 20000,
    category: 'Cà Phê',
    recipe: '25g bột cafe Robusta Đắk Lắk, 80ml nước sôi 95°C, 10g đường hoa mai, đá bi.'
  },
  {
    id: 'CF2',
    name: 'Cà Phê Sữa Đá',
    price: 25000,
    category: 'Cà Phê',
    recipe: '25g cafe phin truyền thống, 25ml sữa đặc Ông Thọ béo ngậy, đá viên đầy ly.'
  },
  {
    id: 'CF3',
    name: 'Bạc Xỉu Sài Gòn',
    price: 29000,
    category: 'Cà Phê',
    recipe: '40ml sữa đặc, 60ml sữa tươi không đường, 20ml cafe cốt tạo tầng nâu đẹp mắt trên cùng.'
  },
  {
    id: 'CF4',
    name: 'Cà Phê Muối Tiến Phát',
    price: 32000,
    category: 'Cà Phê',
    recipe: '30ml cafe cốt đậm đà, 50ml lớp kem béo mặn đánh bông với muối hồng Himalaya.'
  },
  {
    id: 'CF5',
    name: 'Cà Phê Trứng Hà Nội',
    price: 35000,
    category: 'Cà Phê',
    recipe: '2 lòng đỏ trứng gà tươi đánh bông mật ong và sữa đặc thành kem mịn, rót lên cafe đen nóng.'
  },
  {
    id: 'ES1',
    name: 'Americano Đá',
    price: 30000,
    category: 'Cà Phê',
    recipe: 'Double shot Espresso hạt Arabica Cầu Đất, 120ml nước lọc lạnh, đá viên thanh nhẹ ít calo.'
  },
  {
    id: 'ES2',
    name: 'Cafe Latte',
    price: 38000,
    category: 'Cà Phê',
    recipe: '1 shot Espresso, 180ml sữa tươi thanh trùng đánh nóng tạo bọt vi mô microfoam vẽ art.'
  },
  {
    id: 'ES3',
    name: 'Caramel Macchiato',
    price: 42000,
    category: 'Cà Phê',
    recipe: '15ml vanilla syrup, 160ml sữa tươi nóng, 1 shot Espresso rót nhẹ và phủ sốt Caramel đan lưới.'
  },

  // 2. Trà trái cây & Trà sữa
  {
    id: 'TR1',
    name: 'Trà Đào Cam Sả',
    price: 35000,
    category: 'Trà & Trà Sữa',
    recipe: '120ml cốt trà Earl Grey, 20ml syrup đào Monin, 1 tép sả đập dập, 1 lát cam vàng, 3 miếng đào ngâm giòn.'
  },
  {
    id: 'TR2',
    name: 'Trà Vải Hoa Hồng',
    price: 35000,
    category: 'Trà & Trà Sữa',
    recipe: '120ml cốt trà lài thơm ngát, 25ml syrup vải, 5ml siro hoa hồng Pháp, 3 quả vải mọng nước.'
  },
  {
    id: 'TR3',
    name: 'Trà Ổi Hồng Hạt Chia',
    price: 35000,
    category: 'Trà & Trà Sữa',
    recipe: '120ml cốt trà xanh hoa nhài, 30ml puree ổi hồng tự nhiên, 1 muỗng hạt chia ngâm nở, đá viên.'
  },
  {
    id: 'TR4',
    name: 'Trà Mãng Cầu Xiêm',
    price: 38000,
    category: 'Trà & Trà Sữa',
    recipe: '80g thịt mãng cầu xiêm tươi dầm đường phèn, 120ml cốt trà Oolong thanh mát, lắc đều với đá.'
  },
  {
    id: 'TS1',
    name: 'Trà Sữa Tiến Phát Full Topping',
    price: 35000,
    category: 'Trà & Trà Sữa',
    recipe: '150ml trà đen Ceylon ủ đậm, 35g bột sữa béo thực vật, trân châu đen hoàng kim dẻo quánh, pudding trứng.'
  },
  {
    id: 'TS2',
    name: 'Trà Oolong Nướng Kem Cheese',
    price: 38000,
    category: 'Trà & Trà Sữa',
    recipe: '150ml cốt trà Oolong sao nướng đậm hương khói, 40ml lớp kem cheese phô mai mặn béo ngậy.'
  },
  {
    id: 'TS3',
    name: 'Matcha Latte Nhật Bản',
    price: 38000,
    category: 'Trà & Trà Sữa',
    recipe: '5g bột Matcha Uji cao cấp đánh tan với 30ml nước ấm 80°C, 150ml sữa tươi thanh trùng Đà Lạt Milk.'
  },

  // 3. Nước uống khác: Đá xay & Nước ép sinh tố
  {
    id: 'DX1',
    name: 'Freeze Cà Phê Đá Xay',
    price: 42000,
    category: 'Nước Uống & Đá Xay',
    recipe: '40ml cafe phin đặc, 30ml sữa đặc, 20ml sữa tươi, đá bi xay tuyết, phủ bông kem tươi whipping cream.'
  },
  {
    id: 'DX2',
    name: 'Matcha Đá Xay Kem Tuyết',
    price: 42000,
    category: 'Nước Uống & Đá Xay',
    recipe: '6g bột trà xanh matcha, 40ml sữa đặc, 30ml sữa tươi, xay nhuyễn cùng đá bi, xịt kem whipping.'
  },
  {
    id: 'DX3',
    name: 'Cookies & Cream Oreo',
    price: 40000,
    category: 'Nước Uống & Đá Xay',
    recipe: '3 chiếc bánh Oreo bỏ kem, 60ml sữa tươi, 30ml sữa đặc, đá bi xay sánh mịn, rắc vụn bánh giòn.'
  },
  {
    id: 'NE1',
    name: 'Nước Cam Tươi Vắt',
    price: 32000,
    category: 'Nước Uống & Đá Xay',
    recipe: '3 quả cam sành mọng nước vắt lấy cốt nguyên chất, 20ml mật ong nguyên chất, đá viên mát lạnh.'
  },
  {
    id: 'NE2',
    name: 'Sinh Tố Bơ Sáp Dừa',
    price: 38000,
    category: 'Nước Uống & Đá Xay',
    recipe: '150g bơ sáp Đắk Lắk chín tới, 40ml sữa đặc, 20ml nước cốt dừa Bến Tre, đá bi xay sánh dẻo.'
  },
  {
    id: 'NE3',
    name: 'Nước Ép Dưa Hấu Bạc Hà',
    price: 30000,
    category: 'Nước Uống & Đá Xay',
    recipe: '250g dưa hấu đỏ ngọt ép tươi 100%, 3 lá bạc hà vò nhẹ, thanh mát giải nhiệt tức thì.'
  },

  // 4. Đồ ăn & Bánh ngọt ăn vặt
  {
    id: 'BN1',
    name: 'Bánh Croissant Bơ Tỏi',
    price: 28000,
    category: 'Đồ Ăn & Bánh',
    recipe: 'Bánh sừng bò ngàn lớp nướng nóng giòn, quét bơ tỏi thơm ngậy và ngò tây rắc mặt.'
  },
  {
    id: 'BN2',
    name: 'Bánh Tiramisu Ý',
    price: 35000,
    category: 'Đồ Ăn & Bánh',
    recipe: 'Bánh bông lan nhúng cafe espresso kết hợp rượu rum nhẹ, phủ lớp kem phô mai mascarpone rắc bột cacao.'
  },
  {
    id: 'BN3',
    name: 'Khô Bò Sợi Cay Chanh',
    price: 30000,
    category: 'Đồ Ăn & Bánh',
    recipe: '50g khô bò vàng sợi dai ngọt tự nhiên, ớt sấy thơm nồng kèm lát chanh tươi mọng nước.'
  },
  {
    id: 'BN4',
    name: 'Hạt Hướng Dương Vị Dừa',
    price: 15000,
    category: 'Đồ Ăn & Bánh',
    recipe: 'Đĩa 80g hạt hướng dương rang mộc tẩm nước cốt dừa thơm béo, món nhâm nhi trò chuyện.'
  }
];

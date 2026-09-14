export interface MedicalNewsArticleSeed {
  title: string;
  summary: string;
  slug: string;
  content: string;
  topic: {
    name: string;
    slug: string;
    description: string;
  };
  tags: string[];
  image: {
    url: string;
    public_id: string;
  };
}

interface ArticleDraft {
  title: string;
  summary: string;
  focus: string;
  action: string;
  warning?: string;
  tags?: string[];
}

interface TopicBlueprint {
  name: string;
  slug: string;
  description: string;
  overview: string;
  habits: string[];
  warning: string;
  sourceName: string;
  sourceUrl: string;
  imageId: string;
  tags: string[];
  articles: ArticleDraft[];
}

const imageUrl = (imageId: string) =>
  `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1400&q=82`;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const TOPICS: TopicBlueprint[] = [
  {
    name: 'Sức khỏe tim mạch',
    slug: 'suc-khoe-tim-mach',
    description: 'Kiến thức thực hành giúp bảo vệ tim và hệ tuần hoàn.',
    overview:
      'Sức khỏe tim mạch chịu ảnh hưởng đồng thời bởi huyết áp, mỡ máu, vận động, dinh dưỡng, thuốc lá và tiền sử gia đình.',
    habits: [
      'Theo dõi huyết áp và tái khám theo lịch hẹn',
      'Ưu tiên vận động đều, ăn nhạt và không hút thuốc',
    ],
    warning:
      'Đau hoặc đè nặng ngực, khó thở, vã mồ hôi, yếu liệt đột ngột hay nói khó là tình huống cần cấp cứu ngay.',
    sourceName: 'WHO – Cardiovascular diseases',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)',
    imageId: '1532938911079-1b06ac7ceec7',
    tags: ['tim mạch', 'phòng ngừa'],
    articles: [
      {
        title: 'Đo huyết áp tại nhà sao cho kết quả đáng tin cậy',
        summary:
          'Tư thế, thời điểm và cách ghi nhật ký huyết áp ảnh hưởng lớn đến giá trị theo dõi.',
        focus:
          'Nghỉ yên ít nhất vài phút, ngồi tựa lưng, đặt bàn chân trên sàn và giữ vòng bít ngang tim trước khi đo.',
        action:
          'Đo vào cùng khung giờ trong nhiều ngày và mang nhật ký đến lần khám tiếp theo.',
      },
      {
        title:
          'Cholesterol cao: điều cần hiểu trước khi điều chỉnh chế độ sống',
        summary:
          'Mỡ máu cần được đánh giá cùng nguy cơ tim mạch tổng thể, không chỉ nhìn một con số đơn lẻ.',
        focus:
          'LDL, HDL và triglyceride có ý nghĩa khác nhau; bác sĩ sẽ kết hợp tuổi, huyết áp, bệnh nền và tiền sử để đánh giá.',
        action:
          'Giảm chất béo chuyển hóa, tăng chất xơ hòa tan và dùng thuốc đúng chỉ định nếu đã được kê.',
      },
      {
        title: 'Nhận biết sớm dấu hiệu nhồi máu cơ tim',
        summary:
          'Đau ngực không phải lúc nào cũng dữ dội, đặc biệt ở người lớn tuổi và người đái tháo đường.',
        focus:
          'Cảm giác ép ngực, khó thở, buồn nôn hoặc đau lan lên hàm, vai, cánh tay có thể là tín hiệu cảnh báo.',
        action: 'Gọi cấp cứu thay vì tự lái xe hoặc chờ triệu chứng tự hết.',
      },
      {
        title: 'Ăn giảm muối để bảo vệ huyết áp mà món ăn vẫn ngon',
        summary:
          'Giảm muối hiệu quả bắt đầu từ thực phẩm chế biến sẵn và thói quen nêm nếm hằng ngày.',
        focus:
          'Natri có nhiều trong nước chấm, đồ đóng gói, thịt chế biến và món ăn ngoài hàng, kể cả khi không cảm thấy quá mặn.',
        action:
          'Đọc nhãn dinh dưỡng, nếm trước khi nêm và dùng rau thơm, chanh, gia vị tự nhiên để tạo vị.',
      },
      {
        title: 'Đi bộ mỗi ngày mang lại lợi ích gì cho trái tim',
        summary:
          'Hoạt động thể lực vừa sức, duy trì đều đặn có giá trị hơn những đợt tập nặng không thường xuyên.',
        focus:
          'Đi bộ nhanh hỗ trợ sức bền tim phổi, kiểm soát cân nặng, đường huyết và tâm trạng.',
        action:
          'Bắt đầu với quãng ngắn phù hợp thể lực rồi tăng dần thời gian; dừng tập nếu đau ngực hoặc choáng.',
      },
    ],
  },
  {
    name: 'Dinh dưỡng',
    slug: 'dinh-duong',
    description: 'Dinh dưỡng cân bằng, an toàn và phù hợp từng giai đoạn sống.',
    overview:
      'Một chế độ ăn lành mạnh cần đủ chất, cân bằng, đa dạng và ưu tiên thực phẩm ít chế biến.',
    habits: [
      'Ăn đa dạng rau, quả, đậu, ngũ cốc nguyên hạt và nguồn đạm phù hợp',
      'Hạn chế đồ uống có đường, muối và chất béo chuyển hóa',
    ],
    warning:
      'Sụt cân nhanh, khó nuốt, nôn kéo dài hoặc dấu hiệu thiếu dinh dưỡng cần được nhân viên y tế đánh giá.',
    sourceName: 'WHO – Healthy diet',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    imageId: '1490645935967-10de6ba17061',
    tags: ['chế độ ăn', 'lối sống lành mạnh'],
    articles: [
      {
        title: 'Xây dựng một đĩa ăn cân bằng cho bữa cơm gia đình',
        summary:
          'Cách chia nhóm thực phẩm trực quan giúp bữa ăn đủ rau, đạm và tinh bột hợp lý.',
        focus:
          'Không có một thực đơn phù hợp cho tất cả; khẩu phần cần điều chỉnh theo tuổi, mức vận động và bệnh nền.',
        action:
          'Dành phần lớn đĩa cho rau, thêm nguồn đạm nạc và chọn tinh bột ít tinh chế khi có thể.',
      },
      {
        title: 'Chất xơ: tăng thế nào để hệ tiêu hóa kịp thích nghi',
        summary:
          'Tăng chất xơ từ từ và uống đủ nước giúp hạn chế đầy bụng, khó chịu.',
        focus:
          'Rau, quả nguyên miếng, đậu và ngũ cốc nguyên hạt cung cấp nhiều loại chất xơ có lợi.',
        action:
          'Mỗi tuần thêm một nguồn chất xơ mới, theo dõi đáp ứng và tăng nước phù hợp.',
      },
      {
        title: 'Đọc nhãn dinh dưỡng trong ba phút',
        summary:
          'Khẩu phần, đường bổ sung, natri và chất béo bão hòa là những mục nên xem đầu tiên.',
        focus:
          'Con số trên nhãn thường tính cho một khẩu phần, trong khi một gói có thể chứa nhiều khẩu phần.',
        action:
          'So sánh các sản phẩm cùng loại trên cùng khối lượng thay vì dựa vào thông điệp quảng cáo mặt trước.',
      },
      {
        title: 'Uống nước bao nhiêu là đủ trong ngày',
        summary:
          'Nhu cầu nước thay đổi theo thời tiết, vận động, thai kỳ, tuổi và tình trạng bệnh.',
        focus:
          'Nước lọc thường là lựa chọn nền tảng; đồ uống nhiều đường làm tăng năng lượng mà ít giá trị dinh dưỡng.',
        action:
          'Chia nước đều trong ngày và hỏi bác sĩ nếu đang phải hạn chế dịch do bệnh tim hoặc thận.',
      },
      {
        title: 'Bổ sung vitamin có thay thế được bữa ăn đa dạng không',
        summary:
          'Thực phẩm bổ sung không phải giải pháp mặc định cho mọi người và có thể tương tác với thuốc.',
        focus:
          'Thiếu vi chất nên được xác định dựa trên nguy cơ, triệu chứng và đánh giá chuyên môn khi cần.',
        action:
          'Mang danh sách mọi vitamin, thảo dược đang dùng khi đi khám và tránh tự dùng liều cao kéo dài.',
      },
    ],
  },
  {
    name: 'Tiêu hóa',
    slug: 'tieu-hoa',
    description: 'Chăm sóc hệ tiêu hóa và nhận biết các dấu hiệu bất thường.',
    overview:
      'Triệu chứng tiêu hóa thường liên quan đến chế độ ăn và sinh hoạt, nhưng đôi khi là dấu hiệu của bệnh cần chẩn đoán.',
    habits: [
      'Ăn chậm, theo dõi thực phẩm gây khó chịu và duy trì vận động',
      'Không tự lạm dụng thuốc giảm đau, nhuận tràng hoặc kháng sinh',
    ],
    warning:
      'Đau bụng dữ dội, nôn ra máu, đi ngoài phân đen, vàng da hoặc sụt cân không chủ ý cần khám sớm.',
    sourceName: 'NIDDK – Digestive Diseases',
    sourceUrl:
      'https://www.niddk.nih.gov/health-information/digestive-diseases',
    imageId: '1542884748-2b87b36c6b90',
    tags: ['triệu chứng', 'hướng dẫn'],
    articles: [
      {
        title: 'Trào ngược dạ dày: bảy thay đổi nhỏ nên thử trước',
        summary:
          'Điều chỉnh thời điểm ăn, tư thế ngủ và thực phẩm kích hoạt có thể giảm khó chịu.',
        focus:
          'Ợ nóng thường tăng sau bữa lớn, khi nằm sớm hoặc dùng thực phẩm cá nhân nhạy cảm.',
        action:
          'Ăn tối sớm hơn, chia nhỏ bữa và ghi lại món ăn liên quan đến triệu chứng.',
      },
      {
        title: 'Táo bón ở người trưởng thành: xử trí an toàn tại nhà',
        summary:
          'Chất xơ, nước và vận động là nền tảng, nhưng không nên dùng thuốc nhuận tràng kéo dài tùy ý.',
        focus:
          'Tần suất đi tiêu khác nhau giữa mỗi người; thay đổi mới xuất hiện quan trọng hơn một con số cố định.',
        action:
          'Tạo giờ đi vệ sinh đều đặn, tăng chất xơ từ từ và trao đổi với bác sĩ về thuốc đang dùng.',
      },
      {
        title: 'Đầy bụng sau ăn: khi nào chỉ là khó tiêu',
        summary:
          'Ăn nhanh và đồ uống có ga thường gây đầy bụng, song triệu chứng dai dẳng cần được đánh giá.',
        focus:
          'Nhật ký món ăn và triệu chứng giúp nhận diện mối liên quan tốt hơn việc loại bỏ quá nhiều nhóm thực phẩm.',
        action:
          'Ăn chậm, giảm khẩu phần mỗi bữa và không tự chẩn đoán bất dung nạp nếu chưa được tư vấn.',
      },
      {
        title: 'Phòng ngộ độc thực phẩm trong căn bếp gia đình',
        summary:
          'Làm sạch, tách sống chín, nấu đủ nhiệt và bảo quản lạnh đúng cách là bốn nguyên tắc cốt lõi.',
        focus:
          'Vi khuẩn có thể lây chéo qua tay, dao, thớt và thực phẩm đã nấu chín.',
        action:
          'Rửa tay, dùng dụng cụ riêng cho đồ sống và không để thức ăn dễ hỏng ở nhiệt độ phòng quá lâu.',
      },
      {
        title: 'Gan nhiễm mỡ và những thay đổi lối sống có ý nghĩa',
        summary:
          'Kiểm soát cân nặng, đường huyết, mỡ máu và rượu bia giúp giảm gánh nặng cho gan.',
        focus:
          'Gan nhiễm mỡ thường ít triệu chứng nên cần dựa vào đánh giá y khoa thay vì cảm giác cơ thể.',
        action:
          'Đặt mục tiêu giảm cân từ từ, vận động đều và không tự dùng sản phẩm “giải độc gan”.',
      },
    ],
  },
  {
    name: 'Thần kinh',
    slug: 'than-kinh',
    description: 'Thông tin về não bộ, thần kinh và các dấu hiệu cấp cứu.',
    overview:
      'Các bệnh thần kinh có thể ảnh hưởng vận động, cảm giác, ngôn ngữ, trí nhớ và chất lượng giấc ngủ.',
    habits: [
      'Ngủ đủ, vận động đều và kiểm soát các yếu tố nguy cơ mạch máu',
      'Ghi lại thời điểm, mức độ và yếu tố khởi phát triệu chứng',
    ],
    warning:
      'Méo miệng, yếu tay chân, nói khó, co giật kéo dài, đau đầu dữ dội đột ngột hoặc mất ý thức cần cấp cứu.',
    sourceName: 'WHO – Neurological disorders',
    sourceUrl: 'https://www.who.int/health-topics/brain-health',
    imageId: '1576091160399-112ba8d25d1d',
    tags: ['chẩn đoán', 'phòng ngừa'],
    articles: [
      {
        title: 'FAST: ghi nhớ dấu hiệu đột quỵ để hành động kịp thời',
        summary:
          'Nhận biết méo mặt, yếu tay và nói khó giúp rút ngắn thời gian đến cơ sở cấp cứu.',
        focus:
          'Điều trị đột quỵ phụ thuộc thời gian; không chờ người bệnh ngủ một giấc hay tự hồi phục.',
        action:
          'Ghi nhận thời điểm cuối cùng còn bình thường và gọi cấp cứu ngay.',
      },
      {
        title: 'Đau nửa đầu: lập nhật ký để tìm yếu tố khởi phát',
        summary:
          'Nhật ký giấc ngủ, bữa ăn, chu kỳ và thuốc giúp bác sĩ nhận diện kiểu đau đầu.',
        focus:
          'Đau nửa đầu có thể đi kèm buồn nôn, nhạy sáng hoặc tiền triệu nhưng biểu hiện mỗi người khác nhau.',
        action:
          'Ghi thời gian, mức đau, triệu chứng kèm theo và số lần dùng thuốc giảm đau.',
      },
      {
        title: 'Sơ cứu đúng khi gặp người đang co giật',
        summary:
          'Giữ an toàn vùng xung quanh quan trọng hơn việc cố ghì giữ hoặc cho vật vào miệng.',
        focus:
          'Phần lớn cơn co giật tự dừng, nhưng thời lượng cơn và khả năng hồi phục cần được theo dõi.',
        action:
          'Đặt người bệnh nằm nghiêng khi có thể, bảo vệ đầu, bấm giờ và gọi cấp cứu nếu cơn kéo dài.',
      },
      {
        title: 'Hay quên thông thường khác gì suy giảm nhận thức',
        summary:
          'Khó khăn ảnh hưởng sinh hoạt, định hướng hoặc quản lý công việc cần được đánh giá chuyên môn.',
        focus:
          'Stress, thiếu ngủ, thuốc và nhiều bệnh lý có thể gây giảm tập trung giống vấn đề trí nhớ.',
        action:
          'Ghi nhận ví dụ cụ thể, rà soát thuốc và đi khám cùng người thân nếu thay đổi tăng dần.',
      },
      {
        title: 'Giấc ngủ và sức khỏe não bộ có liên quan thế nào',
        summary:
          'Lịch ngủ đều và môi trường ngủ phù hợp hỗ trợ sự tỉnh táo, trí nhớ và cảm xúc.',
        focus:
          'Thiếu ngủ kéo dài không chỉ gây mệt mà còn ảnh hưởng hiệu suất, an toàn và sức khỏe tổng thể.',
        action:
          'Giữ giờ thức ổn định, giảm caffeine cuối ngày và hạn chế màn hình trước khi ngủ.',
      },
    ],
  },
  {
    name: 'Phụ sản',
    slug: 'phu-san',
    description: 'Sức khỏe sinh sản, thai kỳ và chăm sóc sau sinh an toàn.',
    overview:
      'Chăm sóc phụ sản cần được cá thể hóa theo tuổi, tiền sử, kế hoạch sinh sản và diễn biến thai kỳ.',
    habits: [
      'Khám định kỳ và cung cấp đầy đủ danh sách thuốc, thực phẩm bổ sung',
      'Duy trì dinh dưỡng, vận động và tiêm chủng theo tư vấn chuyên môn',
    ],
    warning:
      'Ra máu nhiều, đau bụng dữ dội, khó thở, đau đầu kèm nhìn mờ hoặc giảm cử động thai cần liên hệ cơ sở y tế ngay.',
    sourceName: 'WHO – Maternal health',
    sourceUrl: 'https://www.who.int/health-topics/maternal-health',
    imageId: '1551076805-e1869033e561',
    tags: ['bà bầu', 'tư vấn'],
    articles: [
      {
        title: 'Chuẩn bị cho lần khám thai đầu tiên',
        summary:
          'Tiền sử, thuốc đang dùng và ngày đầu kỳ kinh gần nhất là những thông tin nên chuẩn bị.',
        focus:
          'Lần khám đầu giúp xác định tuổi thai, nguy cơ cá nhân và kế hoạch theo dõi phù hợp.',
        action:
          'Viết sẵn câu hỏi, mang hồ sơ bệnh cũ và không tự ngừng thuốc kê đơn.',
      },
      {
        title: 'Dấu hiệu cảnh báo tiền sản giật không nên bỏ qua',
        summary:
          'Đau đầu dai dẳng, nhìn mờ và phù xuất hiện nhanh có thể cần kiểm tra huyết áp khẩn.',
        focus:
          'Tiền sản giật có thể diễn tiến nghiêm trọng dù thai phụ trước đó cảm thấy khỏe.',
        action:
          'Tuân thủ lịch khám, theo dõi huyết áp nếu được hướng dẫn và liên hệ cơ sở sản khoa khi có dấu hiệu bất thường.',
      },
      {
        title: 'Khám sàng lọc cổ tử cung: vì sao cần đúng lịch',
        summary:
          'Sàng lọc giúp phát hiện biến đổi tế bào trước khi tiến triển thành ung thư.',
        focus:
          'Lịch xét nghiệm phụ thuộc tuổi, kết quả trước đây và hướng dẫn tại nơi sinh sống.',
        action:
          'Trao đổi với bác sĩ về xét nghiệm HPV, tế bào học và tiêm vaccine HPV.',
      },
      {
        title: 'Theo dõi chu kỳ kinh nguyệt để hiểu cơ thể',
        summary:
          'Ghi chu kỳ, lượng máu và triệu chứng đi kèm giúp nhận diện thay đổi có ý nghĩa.',
        focus:
          'Chu kỳ có thể dao động, nhưng rong kinh, đau tăng dần hoặc mất kinh kéo dài cần tìm nguyên nhân.',
        action:
          'Dùng lịch theo dõi và đi khám nếu thay đổi ảnh hưởng sinh hoạt hoặc có khả năng mang thai.',
      },
      {
        title: 'Chăm sóc sức khỏe tinh thần sau sinh',
        summary:
          'Buồn bã kéo dài, mất hứng thú hoặc ý nghĩ làm hại bản thân không phải là điều phải chịu đựng một mình.',
        focus:
          'Thiếu ngủ và thay đổi vai trò có thể gây quá tải; trầm cảm sau sinh cần được nhận diện và điều trị.',
        action:
          'Chia sẻ với người tin cậy, nhờ hỗ trợ chăm bé và liên hệ chuyên gia khi triệu chứng kéo dài.',
      },
    ],
  },
  {
    name: 'Tai - Mũi - Họng',
    slug: 'tai-mui-hong',
    description: 'Chăm sóc thính lực, đường hô hấp trên và giọng nói.',
    overview:
      'Tai, mũi và họng liên kết chặt chẽ; dị ứng, nhiễm trùng và tiếng ồn là những yếu tố thường gặp.',
    habits: [
      'Bảo vệ tai khỏi tiếng ồn lớn và tránh ngoáy tai sâu',
      'Giữ vệ sinh tay, tránh khói thuốc và dùng thuốc đúng chỉ định',
    ],
    warning:
      'Khó thở, nuốt nghẹn, chảy máu không cầm, điếc đột ngột hoặc đau tai kèm yếu mặt cần khám khẩn.',
    sourceName: 'WHO – Deafness and hearing loss',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss',
    imageId: '1526256262350-7da7584cf5eb',
    tags: ['triệu chứng', 'phòng ngừa'],
    articles: [
      {
        title: 'Bảo vệ thính lực khi dùng tai nghe mỗi ngày',
        summary:
          'Giảm âm lượng, nghỉ tai và hạn chế thời gian nghe liên tục giúp giảm phơi nhiễm tiếng ồn.',
        focus:
          'Tổn thương do tiếng ồn có thể tích lũy và không hồi phục hoàn toàn.',
        action:
          'Chọn mức âm lượng vừa đủ nghe, dùng thiết bị chống ồn phù hợp và nghỉ giữa các phiên.',
      },
      {
        title: 'Viêm mũi dị ứng: quản lý tác nhân trong nhà',
        summary:
          'Bụi, nấm mốc, lông thú và khói có thể làm triệu chứng kéo dài.',
        focus:
          'Hắt hơi, ngứa mũi và chảy mũi trong thường gợi ý dị ứng nhưng cần phân biệt với nhiễm trùng.',
        action:
          'Vệ sinh chăn ga, kiểm soát ẩm mốc và dùng thuốc xịt đúng kỹ thuật theo hướng dẫn.',
      },
      {
        title: 'Đau họng khi nào cần dùng kháng sinh',
        summary:
          'Phần lớn đau họng do virus và không cải thiện nhanh hơn nhờ kháng sinh.',
        focus:
          'Kháng sinh chỉ phù hợp khi bác sĩ đánh giá có nhiễm khuẩn cần điều trị.',
        action:
          'Uống đủ nước, theo dõi sốt và không dùng lại đơn thuốc cũ hoặc chia thuốc cho người khác.',
      },
      {
        title: 'Ù tai: dấu hiệu nào cần đi khám sớm',
        summary:
          'Ù một bên, theo nhịp mạch hoặc kèm giảm thính lực đột ngột cần được đánh giá.',
        focus:
          'Ù tai là triệu chứng, không phải một chẩn đoán; nguyên nhân có thể từ ráy tai đến phơi nhiễm tiếng ồn.',
        action:
          'Tránh âm thanh lớn, ghi nhận đặc điểm ù và không tự nhỏ thuốc khi chưa biết tình trạng màng nhĩ.',
      },
      {
        title: 'Chăm sóc tai trẻ nhỏ khi bị đau hoặc chảy dịch',
        summary:
          'Không tự ngoáy tai hay nhỏ dung dịch không rõ loại khi trẻ đau tai.',
        focus:
          'Trẻ nhỏ có thể biểu hiện bằng quấy khóc, kéo tai, sốt hoặc ngủ kém.',
        action:
          'Giữ tai khô, theo dõi toàn trạng và đưa trẻ khám nếu sốt cao, chảy dịch hoặc đau kéo dài.',
      },
    ],
  },
  {
    name: 'Da liễu',
    slug: 'da-lieu',
    description: 'Bảo vệ da, tóc, móng và nhận biết tổn thương cần khám.',
    overview:
      'Hàng rào da cần được bảo vệ khỏi tia cực tím, chất kích ứng, độ ẩm bất lợi và thói quen chăm sóc quá mức.',
    habits: [
      'Làm sạch dịu nhẹ, dưỡng ẩm và chống nắng phù hợp',
      'Không tự dùng corticoid, kháng sinh hoặc sản phẩm trộn không rõ thành phần',
    ],
    warning:
      'Ban lan nhanh kèm khó thở, phồng rộp rộng, sốt hoặc nốt sắc tố thay đổi bất thường cần khám ngay.',
    sourceName: 'NIAMS – Skin Diseases',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/skin-diseases',
    imageId: '1487412720507-e7ab37603c6f',
    tags: ['da nhạy cảm', 'hướng dẫn'],
    articles: [
      {
        title: 'Chống nắng đúng cách trong sinh hoạt hằng ngày',
        summary:
          'Kem chống nắng chỉ là một phần của chiến lược gồm bóng râm, quần áo và thời điểm hoạt động.',
        focus:
          'Tia cực tím vẫn có thể tác động trong ngày nhiều mây và khi ở gần cửa kính.',
        action:
          'Thoa đủ lượng lên vùng hở, bôi lại khi ra mồ hôi hoặc bơi và kết hợp che chắn.',
      },
      {
        title: 'Chăm sóc da mụn mà không làm tổn thương hàng rào da',
        summary:
          'Nặn mụn và dùng nhiều hoạt chất cùng lúc dễ làm viêm, thâm và kích ứng nặng hơn.',
        focus:
          'Điều trị mụn cần thời gian; thay đổi sản phẩm liên tục khiến khó đánh giá hiệu quả.',
        action:
          'Dùng sữa rửa dịu nhẹ, sản phẩm không gây bít tắc và theo phác đồ đủ thời gian.',
      },
      {
        title: 'Viêm da cơ địa: cách giảm vòng xoắn ngứa và gãi',
        summary:
          'Dưỡng ẩm đều, tránh kích ứng và điều trị đợt bùng phát đúng hướng dẫn giúp kiểm soát bệnh.',
        focus:
          'Da khô làm tăng ngứa, còn gãi gây tổn thương và tăng nguy cơ nhiễm trùng.',
        action:
          'Tắm nhanh với nước ấm vừa, dưỡng ẩm ngay sau tắm và cắt móng tay gọn.',
      },
      {
        title: 'Theo dõi nốt ruồi bằng quy tắc ABCDE',
        summary:
          'Bất đối xứng, bờ không đều, màu thay đổi, đường kính tăng và tiến triển là các điểm cần lưu ý.',
        focus:
          'Tự kiểm tra giúp nhận diện thay đổi nhưng không thay thế khám da liễu.',
        action:
          'Chụp ảnh định kỳ trong cùng điều kiện ánh sáng và đi khám khi tổn thương thay đổi.',
      },
      {
        title: 'Nấm da mùa nóng ẩm: phòng tái phát thế nào',
        summary:
          'Giữ vùng da khô thoáng và dùng thuốc đủ thời gian giúp hạn chế lây lan, tái phát.',
        focus:
          'Nấm da có thể giống nhiều bệnh khác nên dùng corticoid tùy ý dễ che lấp triệu chứng.',
        action:
          'Không dùng chung khăn, thay quần áo ẩm sớm và khám nếu tổn thương lan rộng.',
      },
    ],
  },
  {
    name: 'Chăm sóc mắt',
    slug: 'cham-soc-mat',
    description: 'Bảo vệ thị lực và phát hiện sớm bệnh mắt.',
    overview:
      'Nhiều bệnh mắt tiến triển âm thầm; khám định kỳ đặc biệt quan trọng ở người có tuổi, đái tháo đường hoặc tiền sử gia đình.',
    habits: [
      'Nghỉ mắt khi dùng màn hình và bảo vệ mắt khỏi tia cực tím',
      'Kiểm soát đường huyết, huyết áp và dùng kính đúng chỉ định',
    ],
    warning:
      'Mất thị lực đột ngột, đau mắt dữ dội, chớp sáng kèm màn đen hoặc chấn thương hóa chất cần cấp cứu mắt.',
    sourceName: 'WHO – Blindness and vision impairment',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment',
    imageId: '1579684385127-1ef15d508118',
    tags: ['phòng ngừa', 'chẩn đoán'],
    articles: [
      {
        title: 'Quy tắc 20-20-20 có giúp giảm mỏi mắt số',
        summary:
          'Nghỉ nhìn xa đều đặn, chớp mắt và chỉnh màn hình giúp giảm khó chịu khi làm việc lâu.',
        focus:
          'Mỏi mắt số thường gây khô, nặng mắt, đau đầu nhưng không đồng nghĩa mắt bị “yếu” vĩnh viễn.',
        action:
          'Mỗi 20 phút nhìn xa khoảng 20 feet trong 20 giây và đặt màn hình thấp hơn tầm mắt một chút.',
      },
      {
        title: 'Glôcôm vì sao được gọi là kẻ đánh cắp thị lực thầm lặng',
        summary:
          'Bệnh có thể không có triệu chứng sớm, vì vậy người nguy cơ cao cần khám mắt định kỳ.',
        focus:
          'Tổn thương thần kinh thị giác không thể đánh giá chỉ bằng cảm giác nhìn rõ hay mờ.',
        action:
          'Hỏi bác sĩ mắt về tần suất đo nhãn áp và kiểm tra thần kinh thị giác phù hợp.',
      },
      {
        title: 'Bệnh võng mạc đái tháo đường có thể phòng mất thị lực',
        summary:
          'Kiểm soát bệnh nền và khám đáy mắt đúng lịch giúp phát hiện biến đổi trước khi thị lực giảm.',
        focus:
          'Đường huyết cao kéo dài có thể làm tổn thương các mạch máu nhỏ của võng mạc.',
        action:
          'Duy trì lịch khám mắt ngay cả khi nhìn vẫn rõ và báo bác sĩ khi có ruồi bay tăng nhanh.',
      },
      {
        title: 'Khô mắt: điều chỉnh môi trường trước khi tự mua thuốc',
        summary:
          'Điều hòa, quạt, màn hình và một số thuốc có thể làm triệu chứng khô rát nặng hơn.',
        focus:
          'Không phải mọi loại đỏ mắt đều do khô mắt; thuốc co mạch dùng kéo dài có thể gây vấn đề.',
        action:
          'Chớp mắt chủ động, tránh luồng gió trực tiếp và hỏi chuyên gia về loại nước mắt nhân tạo phù hợp.',
      },
      {
        title: 'Dấu hiệu trẻ cần được kiểm tra thị lực',
        summary:
          'Nheo mắt, ngồi sát màn hình, nghiêng đầu hoặc kết quả học tập thay đổi có thể liên quan thị lực.',
        focus:
          'Trẻ nhỏ không phải lúc nào cũng biết mô tả nhìn mờ và có thể thích nghi bằng cách dùng mắt tốt hơn.',
        action:
          'Đưa trẻ khám theo lịch sàng lọc và sớm hơn nếu gia đình nhận thấy dấu hiệu bất thường.',
      },
    ],
  },
  {
    name: 'Cơ xương khớp',
    slug: 'co-xuong-khop',
    description: 'Vận động an toàn, bảo vệ xương khớp và giảm đau đúng cách.',
    overview:
      'Đau cơ xương khớp thường cải thiện khi duy trì vận động phù hợp, nhưng cần loại trừ chấn thương và dấu hiệu thần kinh nguy hiểm.',
    habits: [
      'Tăng cường sức mạnh, độ linh hoạt và kỹ thuật vận động từ từ',
      'Duy trì cân nặng phù hợp và bố trí không gian làm việc hợp lý',
    ],
    warning:
      'Đau sau chấn thương mạnh, biến dạng, sốt kèm sưng khớp, yếu liệt hoặc mất kiểm soát đại tiểu tiện cần khám khẩn.',
    sourceName: 'WHO – Musculoskeletal health',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/musculoskeletal-conditions',
    imageId: '1518611012118-696072aa579a',
    tags: ['bài tập', 'phục hồi'],
    articles: [
      {
        title: 'Đau lưng dưới: nghỉ ngơi hoàn toàn có phải lựa chọn tốt',
        summary:
          'Duy trì hoạt động nhẹ trong giới hạn chịu được thường hữu ích hơn nằm bất động kéo dài.',
        focus:
          'Phần lớn đau lưng không đặc hiệu cải thiện theo thời gian, nhưng dấu hiệu cảnh báo phải được sàng lọc.',
        action:
          'Đi bộ ngắn, đổi tư thế thường xuyên và tăng hoạt động từng bước.',
      },
      {
        title: 'Bảo vệ xương trước nguy cơ loãng xương',
        summary:
          'Vận động chịu lực, dinh dưỡng và đánh giá nguy cơ giúp phòng gãy xương do loãng xương.',
        focus: 'Loãng xương thường không đau cho đến khi xảy ra gãy xương.',
        action:
          'Trao đổi về đo mật độ xương khi đến tuổi hoặc có yếu tố nguy cơ như dùng corticoid kéo dài.',
      },
      {
        title: 'Thoái hóa khớp gối: vận động thế nào để không sợ đau',
        summary:
          'Bài tập sức mạnh và vận động ít tác động giúp duy trì chức năng khớp.',
        focus:
          'Đau nhẹ khi bắt đầu chương trình có thể xảy ra, nhưng sưng tăng hoặc đau kéo dài cần điều chỉnh.',
        action:
          'Bắt đầu với cường độ thấp, tập cơ đùi và chọn đi bộ, đạp xe hoặc bơi theo khả năng.',
      },
      {
        title: 'Thiết lập góc làm việc giảm căng cổ vai gáy',
        summary:
          'Chiều cao màn hình, ghế và thói quen đổi tư thế quan trọng hơn một “tư thế hoàn hảo”.',
        focus: 'Giữ một tư thế quá lâu làm tăng mỏi dù tư thế ban đầu đúng.',
        action:
          'Đặt màn hình ngang tầm, tựa cẳng tay và đứng dậy vận động ngắn sau mỗi khoảng làm việc.',
      },
      {
        title: 'Quay lại tập luyện sau bong gân cần lưu ý gì',
        summary:
          'Khả năng chịu lực, biên độ và thăng bằng nên được phục hồi trước khi trở lại môn thể thao.',
        focus:
          'Hết sưng không có nghĩa dây chằng đã lấy lại hoàn toàn sức mạnh và phản xạ.',
        action:
          'Tăng tải theo giai đoạn và nhờ chuyên gia đánh giá nếu khớp lỏng, đau hoặc sưng tái diễn.',
      },
    ],
  },
  {
    name: 'Lão khoa',
    slug: 'lao-khoa',
    description:
      'Duy trì độc lập, an toàn và chất lượng sống ở người cao tuổi.',
    overview:
      'Chăm sóc người cao tuổi cần xem xét đồng thời vận động, dinh dưỡng, trí nhớ, thuốc, thị lực, thính lực và hỗ trợ xã hội.',
    habits: [
      'Duy trì vận động sức mạnh, thăng bằng và kết nối xã hội',
      'Rà soát thuốc định kỳ và chủ động phòng ngã',
    ],
    warning:
      'Lú lẫn mới xuất hiện, ngã kèm chấn thương đầu, yếu đột ngột hoặc bỏ ăn uống cần được đánh giá sớm.',
    sourceName: 'WHO – Ageing and health',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ageing-and-health',
    imageId: '1584515933487-779824d29309',
    tags: ['người lớn tuổi', 'phòng ngừa'],
    articles: [
      {
        title: 'Phòng ngã cho người cao tuổi từ những thay đổi trong nhà',
        summary:
          'Ánh sáng, tay vịn, thảm và giày dép là những chi tiết nhỏ có thể giảm rủi ro lớn.',
        focus:
          'Ngã thường do nhiều yếu tố kết hợp như yếu cơ, thuốc, thị lực và môi trường.',
        action:
          'Dọn lối đi, cố định thảm, lắp tay vịn và tập thăng bằng phù hợp.',
      },
      {
        title: 'Rà soát thuốc giúp giảm chóng mặt và tương tác',
        summary:
          'Danh sách thuốc đầy đủ giúp bác sĩ nhận diện trùng hoạt chất và tác dụng phụ.',
        focus:
          'Thuốc kê đơn, không kê đơn, vitamin và thảo dược đều cần được tính đến.',
        action:
          'Mang toàn bộ danh sách hoặc hộp thuốc đến mỗi lần khám và không tự bỏ thuốc.',
      },
      {
        title: 'Nhận biết sớm suy yếu thể chất ở người lớn tuổi',
        summary:
          'Đi chậm hơn, giảm cân, mệt và giảm hoạt động có thể báo hiệu tình trạng suy yếu.',
        focus:
          'Can thiệp sớm bằng dinh dưỡng, sức mạnh và điều trị bệnh nền có thể cải thiện chức năng.',
        action:
          'Theo dõi thay đổi khả năng đi lại, đứng lên khỏi ghế và mức độ tham gia sinh hoạt.',
      },
      {
        title: 'Tiêm chủng ở người cao tuổi vì sao vẫn quan trọng',
        summary:
          'Miễn dịch thay đổi theo tuổi khiến một số nhiễm trùng dễ nặng hơn.',
        focus:
          'Lịch vaccine phụ thuộc tuổi, bệnh nền, vaccine trước đây và khuyến cáo địa phương.',
        action:
          'Mang sổ tiêm khi khám và hỏi bác sĩ về cúm, phế cầu, zona cùng các vaccine cần thiết khác.',
      },
      {
        title: 'Bữa ăn nhỏ giàu dinh dưỡng khi người già ăn kém',
        summary:
          'Món mềm, giàu đạm và chia nhỏ bữa có thể hỗ trợ khi cảm giác ngon miệng giảm.',
        focus:
          'Ăn kém có thể liên quan răng miệng, nuốt, thuốc, trầm cảm hoặc bệnh cấp tính.',
        action:
          'Theo dõi cân nặng, ưu tiên món quen dễ ăn và khám nếu sụt cân hoặc ho sặc khi ăn.',
      },
    ],
  },
  {
    name: 'Răng - Hàm - Mặt',
    slug: 'rang-ham-mat',
    description: 'Chăm sóc răng miệng và phòng bệnh vùng hàm mặt.',
    overview:
      'Sức khỏe răng miệng ảnh hưởng ăn uống, giao tiếp và chất lượng sống ở mọi lứa tuổi.',
    habits: [
      'Chải răng với kem chứa fluoride và làm sạch kẽ răng đều đặn',
      'Hạn chế đường tự do, thuốc lá và khám nha khoa định kỳ',
    ],
    warning:
      'Sưng mặt lan nhanh, khó thở, khó nuốt, chấn thương hàm hoặc chảy máu không cầm là tình trạng cấp cứu.',
    sourceName: 'WHO – Oral health',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/oral-health',
    imageId: '1609840114035-3c981b782dfe',
    tags: ['phòng ngừa', 'hướng dẫn'],
    articles: [
      {
        title: 'Chải răng hai phút nhưng đúng kỹ thuật',
        summary:
          'Chải nhẹ theo từng vùng và làm sạch đường viền nướu hiệu quả hơn chà mạnh.',
        focus:
          'Lực quá mạnh có thể gây mòn và tổn thương nướu mà không làm răng sạch hơn.',
        action:
          'Dùng bàn chải lông mềm, kem fluoride và thay bàn chải khi lông xòe.',
      },
      {
        title: 'Làm sạch kẽ răng: chỉ nha khoa hay bàn chải kẽ',
        summary:
          'Dụng cụ phù hợp phụ thuộc khoảng kẽ, phục hình và khả năng thao tác.',
        focus:
          'Mảng bám giữa các răng khó được loại bỏ chỉ bằng bàn chải thông thường.',
        action:
          'Nhờ nha sĩ hướng dẫn kích thước, kỹ thuật và duy trì mỗi ngày.',
      },
      {
        title: 'Chảy máu chân răng không nên xem là bình thường',
        summary:
          'Viêm nướu thường gây chảy máu khi chải và có thể tiến triển nếu mảng bám không được kiểm soát.',
        focus: 'Ngừng chải vùng chảy máu thường khiến mảng bám tích tụ thêm.',
        action:
          'Tiếp tục vệ sinh nhẹ nhàng và khám nha khoa nếu chảy máu kéo dài.',
      },
      {
        title: 'Tạo thói quen chăm răng cho trẻ từ chiếc răng đầu tiên',
        summary:
          'Chăm răng sớm, fluoride đúng lượng và hạn chế bú bình khi ngủ giúp phòng sâu răng.',
        focus:
          'Răng sữa khỏe hỗ trợ ăn nhai, phát âm và giữ chỗ cho răng vĩnh viễn.',
        action:
          'Người lớn hỗ trợ chải răng, chọn lượng kem phù hợp tuổi và đặt lịch nha khoa sớm.',
      },
      {
        title: 'Tổn thương miệng kéo dài cần được kiểm tra',
        summary:
          'Loét, mảng trắng đỏ hoặc khối bất thường không lành sau vài tuần cần khám.',
        focus:
          'Thuốc lá và rượu làm tăng nguy cơ nhiều bệnh răng miệng, bao gồm ung thư miệng.',
        action:
          'Tự quan sát miệng định kỳ và đi khám thay vì tự bôi thuốc kéo dài.',
      },
    ],
  },
  {
    name: 'Ung bướu',
    slug: 'ung-buou',
    description: 'Phòng ngừa, sàng lọc và hiểu đúng về chăm sóc ung thư.',
    overview:
      'Nhiều ung thư có thể giảm nguy cơ hoặc cải thiện kết quả nhờ phòng ngừa, phát hiện sớm và điều trị phù hợp.',
    habits: [
      'Không hút thuốc, hạn chế rượu, vận động và duy trì cân nặng phù hợp',
      'Thực hiện vaccine và sàng lọc theo tuổi, giới và nguy cơ',
    ],
    warning:
      'Khối mới xuất hiện, chảy máu bất thường, sụt cân, ho kéo dài hoặc thay đổi chức năng dai dẳng cần được khám.',
    sourceName: 'WHO – Cancer',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/cancer',
    imageId: '1576091160550-2173dba999ef',
    tags: ['ung thư', 'phòng ngừa'],
    articles: [
      {
        title: 'Sàng lọc ung thư cần cá thể hóa theo nguy cơ',
        summary:
          'Không phải xét nghiệm càng nhiều càng tốt; lợi ích phụ thuộc tuổi, tiền sử và loại ung thư.',
        focus:
          'Sàng lọc áp dụng cho người chưa có triệu chứng và khác với chẩn đoán khi đã có bất thường.',
        action:
          'Trao đổi với bác sĩ về lợi ích, giới hạn và lịch phù hợp thay vì tự mua gói xét nghiệm.',
      },
      {
        title: 'Thuốc lá liên quan đến nhiều loại ung thư hơn bạn nghĩ',
        summary:
          'Bỏ thuốc mang lại lợi ích ở mọi độ tuổi và giảm nguy cơ cho cả người xung quanh.',
        focus:
          'Khói thuốc chứa nhiều chất gây ung thư và không có mức phơi nhiễm thụ động an toàn.',
        action:
          'Đặt ngày bỏ thuốc, tìm hỗ trợ hành vi và hỏi bác sĩ về phương án điều trị lệ thuộc nicotine.',
      },
      {
        title: 'Vaccine HPV và viêm gan B góp phần phòng ung thư',
        summary:
          'Phòng nhiễm virus gây ung thư là một phần quan trọng của chiến lược dự phòng.',
        focus:
          'HPV liên quan nhiều ung thư, còn viêm gan B mạn tính làm tăng nguy cơ ung thư gan.',
        action:
          'Kiểm tra lịch tiêm cho trẻ và người lớn theo khuyến cáo tại Việt Nam.',
      },
      {
        title: 'Dấu hiệu cảnh báo ung thư: hiểu đúng để không hoang mang',
        summary:
          'Phần lớn triệu chứng có nguyên nhân lành tính, nhưng kéo dài hoặc tiến triển cần chẩn đoán.',
        focus:
          'Không có một triệu chứng duy nhất xác định ung thư và xét nghiệm phải được lựa chọn theo tình huống.',
        action:
          'Ghi thời gian xuất hiện, thay đổi theo thời gian và đặt lịch khám thay vì tự kết luận.',
      },
      {
        title: 'Dinh dưỡng trong điều trị ung thư cần tránh lời truyền miệng',
        summary:
          'Nhu cầu ăn uống thay đổi theo loại bệnh, phương pháp điều trị và tác dụng phụ.',
        focus:
          'Chế độ kiêng cực đoan có thể làm tăng nguy cơ suy dinh dưỡng và gián đoạn điều trị.',
        action:
          'Trao đổi với bác sĩ hoặc chuyên gia dinh dưỡng ung bướu trước khi dùng thực phẩm bổ sung.',
      },
    ],
  },
  {
    name: 'Tiểu đường',
    slug: 'tieu-duong',
    description: 'Phòng ngừa và quản lý đái tháo đường an toàn.',
    overview:
      'Đái tháo đường cần được quản lý lâu dài bằng dinh dưỡng, vận động, thuốc và theo dõi biến chứng.',
    habits: [
      'Theo dõi đường huyết theo kế hoạch cá nhân và dùng thuốc đều',
      'Chăm sóc chân, mắt, thận và sức khỏe tim mạch',
    ],
    warning:
      'Lơ mơ, thở bất thường, nôn liên tục, đường huyết rất thấp không hồi phục hoặc rất cao kèm mất nước cần cấp cứu.',
    sourceName: 'WHO – Diabetes',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
    imageId: '1506126613408-eca07ce68773',
    tags: ['bệnh lý', 'chế độ ăn'],
    articles: [
      {
        title: 'Những dấu hiệu sớm có thể gặp ở bệnh đái tháo đường',
        summary:
          'Khát nhiều, tiểu nhiều, mệt, nhìn mờ hoặc sụt cân có thể xuất hiện nhưng không đủ để tự chẩn đoán.',
        focus:
          'Đái tháo đường type 2 đôi khi tiến triển nhiều năm mà triệu chứng rất nhẹ.',
        action:
          'Xét nghiệm theo tư vấn nếu có triệu chứng hoặc yếu tố nguy cơ.',
      },
      {
        title: 'HbA1c nói gì về việc kiểm soát đường huyết',
        summary:
          'HbA1c phản ánh mức đường huyết trung bình trong một giai đoạn, nhưng mục tiêu cần cá thể hóa.',
        focus:
          'Thiếu máu, bệnh thận và một số tình trạng có thể ảnh hưởng cách diễn giải kết quả.',
        action:
          'Xem HbA1c cùng nhật ký đường huyết và kế hoạch điều trị với bác sĩ.',
      },
      {
        title: 'Chăm sóc bàn chân mỗi ngày khi bị đái tháo đường',
        summary:
          'Kiểm tra da, móng và giày dép giúp phát hiện sớm vết thương trước khi trở nặng.',
        focus:
          'Tổn thương thần kinh có thể làm giảm cảm giác đau, trong khi tuần hoàn kém làm vết thương lâu lành.',
        action:
          'Quan sát toàn bộ bàn chân, không đi chân trần và khám sớm khi có phồng rộp hoặc vết loét.',
      },
      {
        title: 'Xử trí hạ đường huyết theo kế hoạch an toàn',
        summary:
          'Run, vã mồ hôi, đói, lú lẫn có thể là dấu hiệu hạ đường huyết cần xử trí nhanh.',
        focus:
          'Nguy cơ phụ thuộc thuốc, bữa ăn, vận động và rượu; người bệnh nên có kế hoạch riêng.',
        action:
          'Mang nguồn carbohydrate tác dụng nhanh và hướng dẫn người thân cách hỗ trợ khi không tỉnh táo.',
      },
      {
        title: 'Lập bữa ăn ổn định cho người đái tháo đường',
        summary:
          'Phân bố carbohydrate, tăng chất xơ và giữ giờ ăn phù hợp giúp đường huyết dễ dự đoán hơn.',
        focus:
          'Không cần loại bỏ hoàn toàn tinh bột; loại, lượng và cách kết hợp mới là điều quan trọng.',
        action:
          'Ưu tiên thực phẩm ít tinh chế, ăn cùng đạm và rau, theo dõi đáp ứng cá nhân.',
      },
    ],
  },
  {
    name: 'Chăm sóc trẻ em',
    slug: 'cham-soc-tre-em',
    description: 'Hướng dẫn an toàn về tăng trưởng và bệnh thường gặp ở trẻ.',
    overview:
      'Trẻ em thay đổi nhanh theo lứa tuổi; đánh giá cần dựa vào toàn trạng, khả năng ăn uống, hô hấp và phát triển.',
    habits: [
      'Tiêm chủng đúng lịch, dinh dưỡng đa dạng và giữ vệ sinh',
      'Theo dõi tăng trưởng, phát triển và tạo môi trường an toàn',
    ],
    warning:
      'Trẻ khó thở, tím tái, li bì, co giật, bỏ bú, mất nước hoặc sốt ở trẻ sơ sinh cần được khám ngay.',
    sourceName: 'WHO – Child health',
    sourceUrl: 'https://www.who.int/health-topics/child-health',
    imageId: '1511174511562-5f7f18b874f8',
    tags: ['trẻ em', 'phòng ngừa'],
    articles: [
      {
        title: 'Theo dõi sốt ở trẻ: quan sát toàn trạng quan trọng hơn con số',
        summary:
          'Khả năng tỉnh táo, uống nước, thở và tuổi của trẻ quyết định mức độ cần đánh giá.',
        focus:
          'Sốt là phản ứng của cơ thể và mức nhiệt không luôn phản ánh mức độ nặng.',
        action:
          'Đo đúng cách, cho trẻ uống đủ và dùng thuốc hạ sốt theo cân nặng khi được hướng dẫn.',
      },
      {
        title: 'Tiêm chủng đúng lịch bảo vệ cả trẻ và cộng đồng',
        summary:
          'Vaccine giúp giảm nguy cơ mắc bệnh nặng và tạo lớp bảo vệ cho người dễ tổn thương.',
        focus:
          'Hoãn hoặc chống chỉ định vaccine chỉ áp dụng trong một số tình huống cụ thể.',
        action:
          'Giữ sổ tiêm, đặt lịch bù nếu trễ và trao đổi với cơ sở tiêm khi trẻ đang bệnh.',
      },
      {
        title: 'Đọc biểu đồ tăng trưởng mà không tạo áp lực ăn uống',
        summary:
          'Xu hướng theo thời gian có ý nghĩa hơn việc so trẻ với một bạn cùng tuổi.',
        focus:
          'Gen, tuổi thai, dinh dưỡng và bệnh lý đều ảnh hưởng chiều cao, cân nặng.',
        action:
          'Theo dõi tại các mốc khám, tạo bữa ăn tích cực và tránh ép ăn.',
      },
      {
        title: 'Bù nước đúng khi trẻ bị tiêu chảy',
        summary:
          'Dung dịch oresol pha đúng hướng dẫn giúp thay nước và điện giải đã mất.',
        focus:
          'Nước ngọt, nước trái cây đậm đặc hoặc oresol pha sai tỷ lệ có thể làm tình trạng xấu hơn.',
        action:
          'Cho uống từng ngụm nhỏ thường xuyên, tiếp tục bú và theo dõi dấu hiệu mất nước.',
      },
      {
        title: 'Dấu hiệu khó thở ở trẻ cha mẹ cần nhận biết',
        summary:
          'Thở nhanh, rút lõm lồng ngực, phập phồng cánh mũi hoặc tím môi là dấu hiệu nguy hiểm.',
        focus: 'Trẻ có thể mệt nhanh và không mô tả được cảm giác khó thở.',
        action:
          'Giữ đường thở thông thoáng và đưa trẻ đến cơ sở y tế, không tự dùng kháng sinh.',
      },
    ],
  },
  {
    name: 'Nam khoa',
    slug: 'nam-khoa',
    description: 'Sức khỏe sinh sản, tiết niệu và dự phòng dành cho nam giới.',
    overview:
      'Khám sức khỏe nam giới cần kết hợp tim mạch, chuyển hóa, tâm lý, sinh sản và tiết niệu.',
    habits: [
      'Khám định kỳ theo tuổi và nguy cơ, không né tránh triệu chứng nhạy cảm',
      'Không hút thuốc, vận động và quan hệ tình dục an toàn',
    ],
    warning:
      'Đau ngực, đau tinh hoàn đột ngột, bí tiểu, tiểu máu hoặc ý nghĩ tự sát cần hỗ trợ y tế khẩn cấp.',
    sourceName: 'MedlinePlus – Men’s Health',
    sourceUrl: 'https://medlineplus.gov/menshealth.html',
    imageId: '1559757175-0eb30cd8c063',
    tags: ['tư vấn', 'lối sống lành mạnh'],
    articles: [
      {
        title: 'Khám sức khỏe nam giới theo từng giai đoạn tuổi',
        summary:
          'Huyết áp, chuyển hóa, vaccine và sàng lọc cần được lựa chọn theo tuổi và nguy cơ.',
        focus:
          'Một gói xét nghiệm giống nhau cho mọi người có thể vừa thiếu vừa thừa.',
        action:
          'Chuẩn bị tiền sử gia đình và trao đổi cởi mở về giấc ngủ, tâm trạng, tình dục, tiểu tiện.',
      },
      {
        title: 'Triệu chứng đường tiểu dưới không chỉ do tuyến tiền liệt',
        summary:
          'Tiểu khó, tia yếu và tiểu đêm có nhiều nguyên nhân cần được phân biệt.',
        focus:
          'Mức độ triệu chứng và ảnh hưởng sinh hoạt giúp quyết định cách đánh giá.',
        action:
          'Ghi nhật ký uống nước, tiểu tiện và đi khám trước khi tự dùng thuốc.',
      },
      {
        title: 'Đau tinh hoàn đột ngột là tình huống không nên chờ',
        summary:
          'Một số nguyên nhân cần xử trí trong thời gian ngắn để bảo tồn chức năng.',
        focus:
          'Đau cấp kèm sưng, buồn nôn hoặc tinh hoàn ở vị trí bất thường có thể là xoắn tinh hoàn.',
        action: 'Đến cấp cứu ngay, không trì hoãn để chườm hoặc tự mua thuốc.',
      },
      {
        title: 'Rối loạn cương có thể là tín hiệu sức khỏe toàn thân',
        summary:
          'Mạch máu, nội tiết, thuốc và tâm lý đều có thể góp phần gây triệu chứng.',
        focus:
          'Sản phẩm quảng cáo không rõ nguồn gốc có thể tương tác nguy hiểm với thuốc tim mạch.',
        action:
          'Trao đổi thẳng thắn với bác sĩ để đánh giá nguyên nhân và lựa chọn điều trị an toàn.',
      },
      {
        title: 'Xây dựng cơ bắp an toàn mà không lạm dụng chất bổ sung',
        summary:
          'Tập tiến triển, ăn đủ đạm và hồi phục là nền tảng thay vì sản phẩm hứa hẹn tăng cơ nhanh.',
        focus:
          'Một số chất bổ sung có thể chứa thành phần không công bố hoặc gây hại gan, thận.',
        action:
          'Đặt mục tiêu thực tế, học kỹ thuật và hỏi chuyên gia nếu có bệnh nền.',
      },
    ],
  },
  {
    name: 'Y học cổ truyền',
    slug: 'y-hoc-co-truyen',
    description:
      'Sử dụng phương pháp truyền thống và bổ sung một cách có trách nhiệm.',
    overview:
      'Phương pháp y học cổ truyền có thể được dùng bổ trợ trong một số trường hợp nhưng vẫn cần đánh giá bằng chứng, chất lượng và tương tác.',
    habits: [
      'Thông báo đầy đủ cho bác sĩ về thảo dược và phương pháp đang dùng',
      'Chọn cơ sở, người hành nghề và sản phẩm có nguồn gốc rõ ràng',
    ],
    warning:
      'Khó thở, phát ban, vàng da, chảy máu bất thường hoặc triệu chứng nặng lên sau khi dùng sản phẩm cần ngừng và đi khám.',
    sourceName: 'NCCIH – Health Topics A–Z',
    sourceUrl: 'https://www.nccih.nih.gov/health/atoz',
    imageId: '1471864190281-a93a3070b6de',
    tags: ['dược phẩm', 'tư vấn'],
    articles: [
      {
        title: 'Thảo dược có thể tương tác với thuốc kê đơn',
        summary:
          'Nguồn gốc tự nhiên không đồng nghĩa an toàn tuyệt đối hoặc phù hợp với mọi bệnh nền.',
        focus:
          'Thảo dược có thể làm thay đổi tác dụng thuốc chống đông, huyết áp, đường huyết và nhiều thuốc khác.',
        action:
          'Ghi tên, liều và nhãn sản phẩm để bác sĩ hoặc dược sĩ kiểm tra tương tác.',
      },
      {
        title: 'Châm cứu an toàn cần đáp ứng những điều kiện nào',
        summary:
          'Kim vô khuẩn, người thực hiện được đào tạo và chẩn đoán rõ ràng là các yêu cầu nền tảng.',
        focus:
          'Châm cứu không nên làm trì hoãn điều trị cấp cứu hoặc điều trị đã có hiệu quả chứng minh.',
        action:
          'Hỏi về chứng chỉ, quy trình kiểm soát nhiễm khuẩn và thông báo bệnh chảy máu hoặc thai kỳ.',
      },
      {
        title: 'Nhận diện quảng cáo “chữa khỏi hoàn toàn” thiếu căn cứ',
        summary:
          'Cam kết tuyệt đối, bí truyền và yêu cầu bỏ điều trị đang dùng là những dấu hiệu cảnh báo.',
        focus:
          'Bằng chứng chất lượng cần có nghiên cứu minh bạch, không chỉ lời chứng thực cá nhân.',
        action:
          'Kiểm tra nguồn, giấy phép và hỏi ý kiến chuyên môn độc lập trước khi chi tiền.',
      },
      {
        title: 'Dùng sản phẩm đông dược khi mang thai cần thận trọng',
        summary:
          'Nhiều thành phần chưa có đủ dữ liệu an toàn cho thai phụ và thai nhi.',
        focus:
          'Sản phẩm phối hợp nhiều vị khiến việc xác định liều và tương tác trở nên khó khăn.',
        action:
          'Không tự dùng để “an thai” hoặc trị nghén nếu chưa trao đổi với bác sĩ sản khoa.',
      },
      {
        title: 'Kết hợp y học cổ truyền và hiện đại theo nguyên tắc an toàn',
        summary:
          'Phối hợp hiệu quả bắt đầu từ mục tiêu rõ, trao đổi minh bạch và theo dõi kết quả.',
        focus:
          'Mỗi phương pháp cần có vai trò cụ thể và tiêu chí dừng nếu không hiệu quả hoặc có tác dụng phụ.',
        action:
          'Dùng một hồ sơ thuốc chung và để các bên chăm sóc biết toàn bộ kế hoạch.',
      },
    ],
  },
  {
    name: 'Tâm thần',
    slug: 'tam-than',
    description: 'Sức khỏe tinh thần, kỹ năng ứng phó và tiếp cận hỗ trợ.',
    overview:
      'Sức khỏe tinh thần là một phần của sức khỏe toàn diện và có thể được cải thiện bằng hỗ trợ phù hợp.',
    habits: [
      'Duy trì nhịp ngủ, vận động, kết nối và giới hạn căng thẳng có thể kiểm soát',
      'Tìm hỗ trợ chuyên môn khi triệu chứng kéo dài hoặc ảnh hưởng chức năng',
    ],
    warning:
      'Ý nghĩ tự sát, hành vi làm hại bản thân, kích động nguy hiểm hoặc mất liên hệ thực tế cần hỗ trợ khẩn cấp và không để người bệnh ở một mình.',
    sourceName: 'WHO – Mental health',
    sourceUrl: 'https://www.who.int/health-topics/mental-health',
    imageId: '1483721310020-03333e577078',
    tags: ['căng thẳng', 'tư vấn'],
    articles: [
      {
        title: 'Lo âu khi nào vượt quá phản ứng căng thẳng thông thường',
        summary:
          'Lo kéo dài, khó kiểm soát và ảnh hưởng học tập, công việc hoặc giấc ngủ cần được quan tâm.',
        focus:
          'Lo âu có thể biểu hiện bằng tim nhanh, căng cơ, khó tập trung và né tránh.',
        action:
          'Theo dõi tác nhân, giảm caffeine và tìm chuyên gia nếu triệu chứng kéo dài.',
      },
      {
        title: 'Nhận biết trầm cảm không chỉ qua cảm giác buồn',
        summary:
          'Mất hứng thú, mệt, rối loạn ngủ và cảm giác vô giá trị có thể là biểu hiện quan trọng.',
        focus:
          'Trầm cảm là tình trạng có thể điều trị, không phải sự yếu đuối hay thiếu ý chí.',
        action:
          'Chia sẻ với người tin cậy và đặt lịch đánh giá khi triệu chứng kéo dài từ nhiều ngày đến nhiều tuần.',
      },
      {
        title: 'Phòng kiệt sức nghề nghiệp bằng thay đổi có hệ thống',
        summary:
          'Nghỉ ngắn chỉ giúp một phần nếu khối lượng, quyền kiểm soát và hỗ trợ tại nơi làm việc không thay đổi.',
        focus:
          'Kiệt sức liên quan bối cảnh công việc và cần giải pháp ở cả cá nhân lẫn tổ chức.',
        action:
          'Xác định nguồn quá tải, đặt ranh giới và trao đổi cụ thể với người quản lý.',
      },
      {
        title: 'Vệ sinh giấc ngủ cho người thường xuyên căng thẳng',
        summary:
          'Giờ thức ổn định, ánh sáng ban ngày và thói quen thư giãn giúp củng cố nhịp sinh học.',
        focus:
          'Cố ngủ bù quá nhiều và dùng rượu để dễ ngủ thường làm chất lượng giấc ngủ kém hơn.',
        action:
          'Rời giường nếu thức quá lâu, làm việc thư giãn ánh sáng thấp rồi quay lại khi buồn ngủ.',
      },
      {
        title: 'Cách hỗ trợ một người đang khủng hoảng tinh thần',
        summary:
          'Lắng nghe trực tiếp, hỏi về an toàn và kết nối dịch vụ có ích hơn lời khuyên sáo rỗng.',
        focus:
          'Hỏi thẳng về ý nghĩ tự sát không làm tăng nguy cơ và có thể mở đường cho hỗ trợ.',
        action:
          'Ở lại cùng họ, loại bỏ phương tiện nguy hiểm nếu an toàn và liên hệ cấp cứu hoặc đường dây hỗ trợ địa phương.',
      },
    ],
  },
  {
    name: 'Phục hồi chức năng',
    slug: 'phuc-hoi-chuc-nang',
    description: 'Khôi phục chức năng, khả năng tham gia và chất lượng sống.',
    overview:
      'Phục hồi chức năng đặt mục tiêu thực tế dựa trên hoạt động người bệnh muốn lấy lại trong đời sống.',
    habits: [
      'Tập đúng kỹ thuật, đều đặn và tăng tải theo khả năng',
      'Theo dõi đau, mệt và phối hợp giữa người bệnh, gia đình, chuyên gia',
    ],
    warning:
      'Khó thở, đau ngực, yếu mới xuất hiện, té ngã hoặc đau tăng nhanh trong khi tập cần dừng và được đánh giá.',
    sourceName: 'WHO – Rehabilitation',
    sourceUrl:
      'https://www.who.int/news-room/fact-sheets/detail/rehabilitation',
    imageId: '1559757148-5c350d0d3c56',
    tags: ['phục hồi', 'bài tập'],
    articles: [
      {
        title: 'Đặt mục tiêu phục hồi sau đột quỵ theo từng bước nhỏ',
        summary:
          'Mục tiêu cụ thể như tự mặc áo hoặc đi trong nhà giúp chương trình tập sát với cuộc sống.',
        focus:
          'Mức hồi phục khác nhau và cần phối hợp vận động, ngôn ngữ, nuốt, nhận thức.',
        action:
          'Chia mục tiêu lớn thành bước đo được và xem lại định kỳ cùng nhóm điều trị.',
      },
      {
        title: 'Tập phục hồi khớp gối: chất lượng quan trọng hơn số lần',
        summary:
          'Kỹ thuật, tải phù hợp và thời gian hồi phục quyết định hiệu quả bài tập.',
        focus:
          'Đau tăng kéo dài hoặc sưng sau tập cho thấy chương trình có thể đang quá tải.',
        action:
          'Ghi mức đau trước và sau tập, thực hiện chậm, đúng trục và tăng dần.',
      },
      {
        title: 'Bài tập thở hỗ trợ người có bệnh hô hấp mạn tính',
        summary:
          'Thở chúm môi và phối hợp nhịp thở khi vận động có thể giảm cảm giác hụt hơi.',
        focus:
          'Bài tập thở bổ trợ chứ không thay thế thuốc và kế hoạch điều trị bệnh nền.',
        action:
          'Học kỹ thuật với chuyên gia, tập khi ổn định và dừng nếu chóng mặt hoặc đau ngực.',
      },
      {
        title: 'Trở lại sinh hoạt sau thời gian nằm viện dài',
        summary:
          'Sức cơ và sức bền có thể giảm nhanh, nên hoạt động cần được tăng từ từ.',
        focus:
          'Mệt sau bệnh nặng là phổ biến nhưng phải phân biệt với biến chứng tim phổi hoặc nhiễm trùng.',
        action:
          'Xen kẽ hoạt động và nghỉ, ưu tiên việc quan trọng và theo dõi tiến bộ hàng tuần.',
      },
      {
        title: 'Vai trò của gia đình trong phục hồi chức năng',
        summary:
          'Hỗ trợ đúng mức khuyến khích độc lập, trong khi làm thay mọi việc có thể giảm cơ hội luyện tập.',
        focus:
          'Người chăm sóc cũng cần kỹ thuật an toàn và thời gian nghỉ để tránh kiệt sức.',
        action:
          'Thống nhất cách trợ giúp với chuyên gia và để người bệnh tự làm phần họ có thể.',
      },
    ],
  },
  {
    name: 'Thận - Tiết niệu',
    slug: 'than-tiet-nieu',
    description: 'Bảo vệ chức năng thận và chăm sóc đường tiết niệu.',
    overview:
      'Bệnh thận có thể tiến triển âm thầm; huyết áp, đái tháo đường, thuốc và nhiễm trùng là những yếu tố quan trọng.',
    habits: [
      'Kiểm soát huyết áp, đường huyết và khám theo nguy cơ',
      'Dùng thuốc đúng hướng dẫn, tránh sản phẩm không rõ nguồn gốc',
    ],
    warning:
      'Không tiểu được, tiểu máu nhiều, đau hông lưng kèm sốt rét run, phù khó thở hoặc lú lẫn cần khám khẩn.',
    sourceName: 'NIDDK – Kidney Disease',
    sourceUrl: 'https://www.niddk.nih.gov/health-information/kidney-disease',
    imageId: '1538108149393-fbbd81895907',
    tags: ['bệnh lý', 'xét nghiệm'],
    articles: [
      {
        title: 'Bệnh thận mạn thường im lặng ở giai đoạn đầu',
        summary:
          'Xét nghiệm máu và nước tiểu giúp phát hiện tổn thương trước khi triệu chứng rõ.',
        focus:
          'Người có đái tháo đường, tăng huyết áp hoặc tiền sử gia đình cần đánh giá nguy cơ định kỳ.',
        action: 'Hỏi bác sĩ về eGFR, albumin niệu và cách bảo vệ thận phù hợp.',
      },
      {
        title: 'Những thay đổi nước tiểu nào cần lưu ý',
        summary:
          'Máu, bọt kéo dài, màu bất thường hoặc thay đổi lượng tiểu cần được xem trong bối cảnh toàn thân.',
        focus:
          'Thực phẩm, thuốc và mất nước cũng có thể đổi màu nước tiểu, nên không thể tự chẩn đoán chỉ bằng quan sát.',
        action:
          'Ghi thời gian, triệu chứng kèm theo và làm xét nghiệm khi được chỉ định.',
      },
      {
        title: 'Phòng sỏi thận bắt đầu từ uống nước và xác định loại sỏi',
        summary:
          'Khuyến nghị ăn uống khác nhau tùy thành phần sỏi và bệnh nền.',
        focus:
          'Uống đủ giúp pha loãng nước tiểu, nhưng người phải hạn chế dịch cần kế hoạch riêng.',
        action:
          'Phân bố nước trong ngày, giảm muối và không tự kiêng hoàn toàn canxi.',
      },
      {
        title: 'Nhiễm trùng tiểu: vì sao cần dùng kháng sinh đúng đơn',
        summary:
          'Điều trị phụ thuộc vị trí nhiễm trùng, thai kỳ, giới, bệnh nền và kết quả xét nghiệm.',
        focus:
          'Tự dùng thuốc cũ có thể không đúng vi khuẩn và làm chậm xử trí nhiễm trùng thận.',
        action:
          'Uống thuốc đủ liệu trình và khám lại nếu sốt, đau lưng hoặc triệu chứng không cải thiện.',
      },
      {
        title: 'Thuốc giảm đau và nguy cơ đối với thận',
        summary:
          'Một số thuốc chống viêm có thể gây hại thận, nhất là khi mất nước hoặc đã có bệnh thận.',
        focus:
          'Thuốc không kê đơn vẫn có chống chỉ định, liều tối đa và tương tác.',
        action:
          'Đọc hoạt chất, tránh dùng trùng và hỏi dược sĩ hoặc bác sĩ nếu phải dùng nhiều ngày.',
      },
    ],
  },
  {
    name: 'Phòng bệnh',
    slug: 'phong-benh',
    description: 'Thói quen và biện pháp dự phòng bệnh trong cộng đồng.',
    overview:
      'Phòng bệnh hiệu quả kết hợp vệ sinh, vaccine, môi trường an toàn, lối sống và phát hiện sớm.',
    habits: [
      'Rửa tay, che ho, đảm bảo thực phẩm và nước sạch',
      'Tiêm chủng, kiểm tra sức khỏe và kiểm soát yếu tố nguy cơ',
    ],
    warning:
      'Khó thở, mất ý thức, sốt kèm cứng gáy, dấu hiệu mất nước nặng hoặc diễn biến nhanh cần cấp cứu.',
    sourceName: 'CDC – Health Topics',
    sourceUrl: 'https://www.cdc.gov/health-topics.html',
    imageId: '1498837167922-ddd27525d352',
    tags: ['phòng ngừa', 'hướng dẫn'],
    articles: [
      {
        title: 'Rửa tay đúng thời điểm để giảm lây nhiễm',
        summary:
          'Rửa tay trước ăn, sau vệ sinh và sau khi trở về từ nơi công cộng là thói quen nền tảng.',
        focus:
          'Xà phòng và thao tác đủ các mặt bàn tay giúp loại bỏ mầm bệnh hiệu quả.',
        action:
          'Chà tay ít nhất 20 giây và dùng dung dịch cồn khi không có nước sạch.',
      },
      {
        title: 'Chuẩn bị mùa cúm cho cả gia đình',
        summary:
          'Vaccine, thông khí, vệ sinh tay và nghỉ khi bệnh giúp giảm lây lan.',
        focus:
          'Cúm có thể gây biến chứng nặng ở người già, trẻ nhỏ, thai phụ và người có bệnh nền.',
        action:
          'Kiểm tra lịch vaccine, chuẩn bị nhiệt kế và kế hoạch chăm sóc người nguy cơ cao.',
      },
      {
        title: 'Phòng bệnh do muỗi trong mùa mưa',
        summary:
          'Loại bỏ nước đọng và tránh muỗi đốt cần được thực hiện đều trong nhà lẫn khu vực xung quanh.',
        focus:
          'Muỗi truyền bệnh có thể hoạt động ở nhiều thời điểm khác nhau trong ngày.',
        action:
          'Đậy dụng cụ chứa nước, thay nước định kỳ, dùng màn và chất xua muỗi theo hướng dẫn.',
      },
      {
        title: 'Bảo vệ sức khỏe trong những ngày nắng nóng',
        summary:
          'Uống nước, giảm hoạt động giờ nóng và nhận biết kiệt sức giúp phòng sốc nhiệt.',
        focus:
          'Người cao tuổi, trẻ nhỏ, người lao động ngoài trời và dùng một số thuốc có nguy cơ cao hơn.',
        action:
          'Lên lịch hoạt động vào giờ mát, mặc đồ thoáng và không để người hoặc thú cưng trong xe đóng kín.',
      },
      {
        title: 'Khám sức khỏe định kỳ nên tập trung vào điều gì',
        summary:
          'Sàng lọc dựa trên nguy cơ và tư vấn lối sống thường có giá trị hơn danh sách xét nghiệm đại trà.',
        focus:
          'Tuổi, giới, tiền sử gia đình, nghề nghiệp và bệnh nền quyết định nội dung kiểm tra.',
        action:
          'Mang hồ sơ cũ, danh sách thuốc và chuẩn bị ba vấn đề sức khỏe ưu tiên để trao đổi.',
      },
    ],
  },
];

const buildContent = (topic: TopicBlueprint, draft: ArticleDraft) => {
  const habits = [...topic.habits, draft.action]
    .map((habit) => `<li>${escapeHtml(habit)}</li>`)
    .join('');
  const tags = [...topic.tags, ...(draft.tags ?? [])];

  return {
    title: draft.title,
    summary: draft.summary,
    slug: slugify(draft.title),
    content: [
      `<p><strong>${escapeHtml(draft.summary)}</strong></p>`,
      '<h2>Điều cần hiểu</h2>',
      `<p>${escapeHtml(topic.overview)} ${escapeHtml(draft.focus)}</p>`,
      '<h2>Những việc nên làm</h2>',
      `<ol>${habits}</ol>`,
      '<h2>Khi nào cần đi khám?</h2>',
      `<p>${escapeHtml(draft.warning ?? topic.warning)}</p>`,
      '<blockquote><p>Bài viết cung cấp thông tin giáo dục sức khỏe, không thay thế chẩn đoán hoặc phác đồ của bác sĩ. Không tự ý ngừng thuốc đang được kê.</p></blockquote>',
      '<h2>Nguồn tham khảo</h2>',
      `<p><a href="${escapeHtml(topic.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(topic.sourceName)}</a>. Nội dung đã được LifeHealth biên tập lại bằng tiếng Việt để phù hợp mục đích truyền thông sức khỏe cộng đồng.</p>`,
    ].join(''),
    topic: {
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
    },
    tags: [...new Set(tags)],
    image: {
      url: imageUrl(topic.imageId),
      public_id: `unsplash-${topic.imageId}`,
    },
  } satisfies MedicalNewsArticleSeed;
};

export const MEDICAL_NEWS_ARTICLES: MedicalNewsArticleSeed[] = TOPICS.flatMap(
  (topic) => topic.articles.map((article) => buildContent(topic, article)),
);

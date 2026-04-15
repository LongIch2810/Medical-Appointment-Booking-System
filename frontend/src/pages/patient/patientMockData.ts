import {
  getRelativeHealthProfileId,
  type ConsultationConversation,
  type ConsultationMessage,
  type HealthRecordData,
  type HealthProfileId,
  type PatientAppointment,
  type PatientRelatives,
  type PatientProfile,
  type PatientSettings,
  type VisitResult,
} from "@/pages/patient/patientTypes";

export const MOCK_PROFILE: PatientProfile = {
  fullName: "Nguyễn Thị Minh Anh",
  email: "minhanh.patient@example.com",
  phone: "0901234567",
  dateOfBirth: "1994-07-21",
  gender: "Nữ",
  address: "123 Nguyễn Trãi, Quận 1, TP.HCM",
  insuranceNumber: "BHYT-0794-2211",
  emergencyContact: "Nguyễn Văn Khoa - 0911222333",
};

export const MOCK_APPOINTMENTS: PatientAppointment[] = [
  {
    id: 1001,
    doctorName: "BS. Trần Thanh Nam",
    specialty: "Nội tổng quát",
    clinic: "Phòng khám Đa khoa LifeHealth - Cơ sở Quận 1",
    date: "2026-03-29",
    time: "08:30 - 09:00",
    fee: "300.000 VND",
    status: "confirmed",
  },
  {
    id: 1002,
    doctorName: "BS. Phạm Thu Hà",
    specialty: "Da liễu",
    clinic: "Phòng khám Đa khoa LifeHealth - Cơ sở Bình Thạnh",
    date: "2026-04-02",
    time: "14:00 - 14:30",
    fee: "350.000 VND",
    status: "pending",
  },
  {
    id: 1003,
    doctorName: "BS. Lê Quốc Dũng",
    specialty: "Tim mạch",
    clinic: "Phòng khám Đa khoa LifeHealth - Cơ sở Thủ Đức",
    date: "2026-03-10",
    time: "10:00 - 10:30",
    fee: "450.000 VND",
    status: "completed",
  },
];

export const MOCK_DEPENDENTS: PatientRelatives[] = [
  {
    id: 1,
    fullName: "Nguyễn Minh Khang",
    relationship: "Con",
    dateOfBirth: "2017-05-18",
    gender: "Nam",
    phone: "0901000111",
    insuranceNumber: "BHYT-2017-3321",
  },
  {
    id: 2,
    fullName: "Trần Thị Lan",
    relationship: "Me",
    dateOfBirth: "1968-02-10",
    gender: "Nữ",
    phone: "0912333444",
    insuranceNumber: "BHYT-1968-8822",
  },
];

export const MOCK_SETTINGS: PatientSettings = {
  emailNotifications: true,
  smsNotifications: true,
  reminderNotifications: true,
  shareMedicalData: false,
  twoFactorAuth: false,
};

export const MOCK_CONVERSATIONS: ConsultationConversation[] = [
  {
    id: 1,
    doctorName: "BS. Trần Thanh Nam",
    specialty: "Nội tổng quát",
    lastMessage: "Bạn nhớ mang kết quả xét nghiệm gần nhất nhé.",
    lastTime: "10:12",
    unread: 1,
  },
  {
    id: 2,
    doctorName: "BS. Phạm Thu Hà",
    specialty: "Da liễu",
    lastMessage: "Tình trạng da đã đỡ hơn chưa?",
    lastTime: "Hôm qua",
    unread: 0,
  },
];

export const MOCK_MESSAGES: ConsultationMessage[] = [
  {
    id: 1,
    conversationId: 1,
    sender: "doctor",
    content: "Chào bạn, triệu chứng đau đầu hiện tại thế nào?",
    sentAt: "09:50",
  },
  {
    id: 2,
    conversationId: 1,
    sender: "patient",
    content: "Đã đỡ hơn, nhưng vẫn mệt vào buổi chiều.",
    sentAt: "10:00",
  },
  {
    id: 3,
    conversationId: 1,
    sender: "doctor",
    content: "Bạn nhớ mang kết quả xét nghiệm gần nhất nhé.",
    sentAt: "10:12",
  },
  {
    id: 4,
    conversationId: 2,
    sender: "doctor",
    content: "Tình trạng da đã đỡ hơn chưa?",
    sentAt: "08:42",
  },
];

export const MOCK_HEALTH_RECORD: HealthRecordData = {
  bloodType: "O+",
  height: "162 cm",
  weight: "54 kg",
  allergies: ["Dị ứng hải sản", "Dị ứng bụi nhà"],
  chronicConditions: ["Viêm mũi dị ứng"],
  medications: [
    {
      name: "Cetirizine 10mg",
      dosage: "1 viên",
      schedule: "Buổi tối sau ăn",
    },
    {
      name: "Vitamin D3",
      dosage: "1 viên",
      schedule: "Buổi sáng",
    },
  ],
  metrics: [
    { label: "Huyết áp", value: "118/76 mmHg", trend: "Ổn định" },
    { label: "Nhịp tim", value: "76 bpm", trend: "Bình thường" },
    { label: "Đường huyết", value: "5.3 mmol/L", trend: "Tốt" },
    { label: "SpO2", value: "98%", trend: "Ổn định" },
  ],
  timeline: [
    {
      id: 1,
      date: "2026-03-10",
      event: "Tái khám tim mạch",
      detail: "Bác sĩ đánh giá tình trạng ổn định, hẹn tái khám sau 3 tháng.",
    },
    {
      id: 2,
      date: "2026-01-18",
      event: "Khám tổng quát",
      detail: "Khuyến nghị tăng vận động và theo dõi huyết áp tại nhà.",
    },
    {
      id: 3,
      date: "2025-12-05",
      event: "Xét nghiệm máu",
      detail: "Chỉ số mỡ máu trong giới hạn cho phép.",
    },
  ],
};

const MOCK_HEALTH_RECORD_RELATIVE_1: HealthRecordData = {
  bloodType: "A+",
  height: "124 cm",
  weight: "26 kg",
  allergies: ["Di ung sua bo"],
  chronicConditions: ["Viem mui di ung theo mua"],
  medications: [
    {
      name: "Siro khang histamine",
      dosage: "5 ml",
      schedule: "Buoi toi sau an",
    },
  ],
  metrics: [
    { label: "Nhiet do", value: "36.7°C", trend: "On dinh" },
    { label: "Nhip tim", value: "92 bpm", trend: "Binh thuong" },
    { label: "SpO2", value: "99%", trend: "Tot" },
    { label: "Can nang", value: "26 kg", trend: "Tang chuan" },
  ],
  timeline: [
    {
      id: 1,
      date: "2026-02-20",
      event: "Kham nhi dinh ky",
      detail: "Phat trien the chat tot, tiep tuc theo doi dinh duong.",
    },
    {
      id: 2,
      date: "2025-12-15",
      event: "Tiem chung nhac lai",
      detail: "Khong ghi nhan phan ung bat thuong sau tiem.",
    },
  ],
};

const MOCK_HEALTH_RECORD_RELATIVE_2: HealthRecordData = {
  bloodType: "B+",
  height: "155 cm",
  weight: "54 kg",
  allergies: ["Di ung penicillin"],
  chronicConditions: ["Tang huyet ap"],
  medications: [
    {
      name: "Amlodipine 5mg",
      dosage: "1 vien",
      schedule: "Buoi sang",
    },
  ],
  metrics: [
    { label: "Huyet ap", value: "130/82 mmHg", trend: "Can theo doi" },
    { label: "Nhip tim", value: "78 bpm", trend: "On dinh" },
    { label: "Duong huyet", value: "5.8 mmol/L", trend: "Binh thuong" },
    { label: "SpO2", value: "98%", trend: "Tot" },
  ],
  timeline: [
    {
      id: 1,
      date: "2026-03-01",
      event: "Tai kham noi khoa",
      detail: "Khuyen nghi duy tri thuoc va an giam muoi.",
    },
    {
      id: 2,
      date: "2026-01-10",
      event: "Danh gia tim mach",
      detail: "Cac chi so on dinh, hen tai kham sau 3 thang.",
    },
  ],
};

export const MOCK_HEALTH_RECORDS_BY_PROFILE_ID: Partial<
  Record<HealthProfileId, HealthRecordData>
> = {
  owner: MOCK_HEALTH_RECORD,
  [getRelativeHealthProfileId(1)]: MOCK_HEALTH_RECORD_RELATIVE_1,
  [getRelativeHealthProfileId(2)]: MOCK_HEALTH_RECORD_RELATIVE_2,
};

export const MOCK_VISIT_RESULTS: VisitResult[] = [
  {
    id: 1,
    visitDate: "2026-03-10",
    doctorName: "BS. Lê Quốc Dũng",
    specialty: "Tim mạch",
    diagnosis: "Rối loạn nhịp tim nhẹ, đã cải thiện",
    recommendations: [
      "Duy trì ngủ đủ 7-8 giờ",
      "Hạn chế caffeine sau 16h",
      "Tập thể dục nhẹ 30 phút mỗi ngày",
    ],
    prescriptions: ["Magnesium B6 - 1 viên/ngày trong 30 ngày"],
    note: "Theo dõi nhịp tim tại nhà, tái khám sau 3 tháng.",
  },
  {
    id: 2,
    visitDate: "2026-01-18",
    doctorName: "BS. Trần Thanh Nam",
    specialty: "Nội tổng quát",
    diagnosis: "Sức khỏe tổng quát tốt, có dấu hiệu thiếu vitamin D nhẹ",
    recommendations: [
      "Tăng tiếp xúc nắng sớm",
      "Bổ sung thực phẩm giàu vitamin D",
      "Tái khám định kỳ 6 tháng",
    ],
    prescriptions: ["Vitamin D3 - 1 viên/ngày trong 8 tuần"],
    note: "Không có bất thường nghiêm trọng.",
  },
];

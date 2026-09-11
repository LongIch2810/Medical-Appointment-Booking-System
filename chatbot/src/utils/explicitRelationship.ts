export const relationshipCodes = [
  'ban_than',
  'me',
  'cha',
  'con_gai',
  'con_trai',
  'vo_chong',
  'ong',
  'ba',
  'nguoi_than_khac',
] as const;

export type RelationshipCode = (typeof relationshipCodes)[number];

type RelationshipMatcher = {
  code: Exclude<RelationshipCode, 'ban_than'>;
  pattern: RegExp;
};

// Các cụm dài/đặc biệt phải đứng trước từ đơn: ví dụ "bà xã" là vợ,
// không phải bà. Pattern dùng biên ký tự Unicode để "ba" không khớp "bác".
const relationshipMatchers: RelationshipMatcher[] = [
  {
    code: 'vo_chong',
    pattern: /(?:^|[^\p{L}])(vợ|chồng|ông\s+xã|bà\s+xã)(?=$|[^\p{L}])/u,
  },
  {
    code: 'con_gai',
    pattern: /(?:^|[^\p{L}])(con\s+gái|bé\s+gái)(?=$|[^\p{L}])/u,
  },
  {
    code: 'con_trai',
    pattern: /(?:^|[^\p{L}])(con\s+trai|bé\s+trai)(?=$|[^\p{L}])/u,
  },
  {
    code: 'cha',
    // "ba" đứng trước một đơn vị thời gian/số lượng (VD: "ba giờ", "ba ngày
    // nữa") gần như luôn là số 3, không phải quan hệ cha — loại các trường
    // hợp đó ra để tránh hiểu nhầm câu đặt lịch cho bản thân thành đặt cho cha.
    pattern:
      /(?:^|[^\p{L}])(bố|cha|ba(?!\s*(?:giờ|tiếng|ngày|tháng|tuần|phút|giây|năm|lần|chục)))(?=$|[^\p{L}])/u,
  },
  {
    code: 'me',
    pattern: /(?:^|[^\p{L}])(mẹ|má)(?=$|[^\p{L}])/u,
  },
  {
    code: 'ong',
    pattern: /(?:^|[^\p{L}])ông(?=$|[^\p{L}])/u,
  },
  {
    code: 'ba',
    pattern: /(?:^|[^\p{L}])bà(?=$|[^\p{L}])/u,
  },
  {
    code: 'nguoi_than_khac',
    // Không nhận diện bác/cô/anh/chị/em ở đây vì chúng thường là cách xưng hô
    // với bác sĩ hoặc chatbot, không phải người được khám.
    pattern:
      /(?:^|[^\p{L}])(dượng|dì|cậu|chú|thím)(?=$|[^\p{L}])/u,
  },
];

/**
 * Nhận diện quan hệ được nêu rõ trong câu mà không phụ thuộc LLM.
 * Trả về null khi không có quan hệ nào để caller mới được mặc định ban_than.
 */
export function detectExplicitRelationship(
  text: string,
): Exclude<RelationshipCode, 'ban_than'> | null {
  const normalizedText = text.normalize('NFC').toLocaleLowerCase('vi-VN');
  return (
    relationshipMatchers.find(({ pattern }) => pattern.test(normalizedText))
      ?.code ?? null
  );
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  loading = 'loading', // using lowercase to match common UI patterns, or map it
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface OutlineItem {
  id: string;
  originalText: string;
  level: number; // Indentation level (0 is root)
  generatedText: string;
  status: GenerationStatus;
  errorMessage?: string;
  isSelected: boolean;
}

export interface GenerationConfig {
  tone: string[]; // Changed to array
  language: string;
  detailLevel: 'brief' | 'standard' | 'detailed';
}

export const SAMPLE_OUTLINE = `Chủ đề: Lợi ích của việc đọc sách

1. Mở bài
- Giới thiệu chung về văn hóa đọc
- Dẫn dắt vào tầm quan trọng của sách

2. Thân bài
- Luận điểm 1: Đọc sách mở mang kiến thức
-- Sách là kho tàng tri thức nhân loại
-- Giúp ta hiểu về lịch sử, văn hóa, khoa học
- Luận điểm 2: Đọc sách rèn luyện tư duy
-- Tăng khả năng tập trung
-- Kích thích trí tưởng tượng phong phú
- Luận điểm 3: Đọc sách nuôi dưỡng tâm hồn
-- Giúp giảm căng thẳng sau giờ làm việc
-- Hình thành nhân cách tốt đẹp qua các bài học đạo đức

3. Kết bài
- Khẳng định lại giá trị của việc đọc sách
- Lời khuyên cho mọi người nên duy trì thói quen đọc`;
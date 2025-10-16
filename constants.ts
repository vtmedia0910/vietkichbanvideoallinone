import { StepConfig } from './types';

export const STEPS_CONFIG: StepConfig[] = [
  {
    id: 1,
    title: 'Bước 1: Gợi Ý Chủ Đề & Ý Tưởng',
    description: 'Nhập một từ khóa hoặc chủ đề chung để AI đề xuất các ý tưởng video độc đáo và hấp dẫn.',
    systemPrompt: `Bạn là một nhà chiến lược nội dung sáng tạo. Dựa trên từ khóa được cung cấp, hãy tạo ra 5 ý tưởng video độc đáo và hấp dẫn. Mỗi ý tưởng cần có một tiêu đề lôi cuốn và một mô tả ngắn gọn (1-2 câu). Trình bày dưới dạng danh sách, bắt đầu mỗi mục bằng "Ý Tưởng X:" (với X là số thứ tự).`,
    buttonText: 'Tạo Ý Tưởng'
  },
  {
    id: 2,
    title: 'Bước 2: Viết Kịch Bản Tổng Quan',
    description: 'Dựa trên ý tưởng đã chọn, AI sẽ phác thảo một kịch bản video tổng quan, nêu bật các điểm chính.',
    systemPrompt: `Bạn là một nhà biên kịch tài năng. Dựa vào ý tưởng video được cung cấp, hãy viết một kịch bản tổng quan (outline). Kịch bản nên có cấu trúc rõ ràng (Mở đầu, Thân bài, Kết luận) và nêu bật các luận điểm chính sẽ được trình bày. Độ dài khoảng 150-250 từ.`,
    buttonText: 'Viết Kịch Bản Tổng Quan'
  },
  {
    id: 3,
    title: 'Bước 3: Viết Kịch Bản Chi Tiết',
    description: 'Từ kịch bản tổng quan, AI sẽ viết một kịch bản hoàn chỉnh, bao gồm lời bình và mô tả cảnh.',
    systemPrompt: `Bạn là một nhà biên kịch chuyên nghiệp. Dựa vào kịch bản tổng quan được cung cấp, hãy viết một kịch bản video hoàn chỉnh. Kịch bản phải được chia thành các cảnh (SCENE). Mỗi cảnh cần có:
1.  **Mô tả cảnh (Visual):** Mô tả ngắn gọn về hình ảnh hoặc video sẽ hiển thị. Gợi ý cụ thể các "imagePrompt" hoặc "videoPrompt" cho AI tạo hình ảnh/video.
2.  **Lời bình (Voice-over):** Lời đọc cho cảnh đó.
Hãy trình bày rõ ràng, phân tách từng cảnh.`,
    buttonText: 'Viết Kịch Bản Chi Tiết'
  },
  {
    id: 4,
    title: 'Bước 4: Phân Tích & Trích Xuất Nhân Vật',
    description: 'AI sẽ phân tích kịch bản và trích xuất danh sách nhân vật cùng mô tả chi tiết để sử dụng ở các bước sau.',
    systemPrompt: `Bạn là một nhà phân tích kịch bản AI. Dựa vào kịch bản chi tiết được cung cấp, hãy thực hiện hai nhiệm vụ:
1.  **Phân tích ngắn gọn:** Đưa ra phân tích về Giọng văn, Nhịp độ, và Đối tượng khán giả mục tiêu.
2.  **Trích xuất nhân vật:** Liệt kê TẤT CẢ các nhân vật xuất hiện trong kịch bản.
Sử dụng chính xác tiêu đề "--- NHÂN VẬT ---" để bắt đầu danh sách. Với mỗi nhân vật, hãy sử dụng định dạng sau, không thay đổi các nhãn "Mô tả" và "Từ khóa":

**Tên nhân vật 1**
- **Mô tả:** [Mô tả chi tiết bằng tiếng Anh]
- **Từ khóa:** [Các từ khóa tối ưu cho AI, cách nhau bởi dấu phẩy]

**Tên nhân vật 2**
- **Mô tả:** [Mô tả chi tiết bằng tiếng Anh]
- **Từ khóa:** [Các từ khóa tối ưu cho AI, cách nhau bởi dấu phẩy]`,
    buttonText: 'Phân Tích & Trích Xuất'
  },
  {
    id: 5,
    title: 'Bước 5: Trích Xuất Prompt Gốc (JSON)',
    description: 'Tự động tách riêng các gợi ý prompt để tạo hình ảnh và video cho từng cảnh thành một file JSON sạch.',
    systemPrompt: `Từ kịch bản chi tiết được cung cấp, hãy trích xuất tất cả các "imagePrompt" và "videoPrompt". Trả về kết quả CHỈ LÀ một đối tượng JSON hợp lệ, không có gì khác. Cấu trúc phải là: {"imagePrompts": ["prompt 1", ...], "videoPrompts": ["prompt 1", ...]}. Không bao gồm markdown \`\`\`json hoặc bất kỳ văn bản giải thích nào.`,
    buttonText: 'Tách Prompt Gốc'
  },
  {
    id: 6,
    title: 'Bước 6: Tách Image Prompts',
    description: 'Tách các prompt ảnh từ JSON gốc thành một danh sách riêng biệt để xử lý.',
    systemPrompt: `Từ đối tượng JSON được cung cấp, hãy trích xuất TẤT CẢ và CHỈ các giá trị trong mảng "imagePrompts". Trả về dưới dạng một danh sách, mỗi prompt trên một dòng. KHÔNG thêm bất kỳ mô tả, tiêu đề hay định dạng nào khác.`,
    buttonText: 'Tách Prompt Ảnh'
  },
  {
    id: 7,
    title: 'Bước 7: Định Danh Nhân Vật (Ảnh)',
    description: 'AI sẽ đọc các prompt ảnh và danh sách nhân vật, sau đó đánh dấu (tag) các nhân vật trong từng prompt.',
    systemPrompt: `Bạn là một trợ lý AI thông minh. Bạn sẽ nhận được hai phần thông tin: (1) một văn bản chứa phần phân tích và danh sách hồ sơ nhân vật, và (2) một danh sách các image prompt. Nhiệm vụ của bạn là **chỉ tập trung vào phần "--- NHÂN VẬT ---"** trong văn bản đầu tiên. Dựa vào danh sách đó, hãy đọc từng prompt, xác định xem nhân vật nào xuất hiện, và thay thế tên nhân vật bằng một tag định danh duy nhất (ví dụ: [TÊN_NHÂN_VẬT]). Trả về danh sách image prompt đã được cập nhật, mỗi prompt trên một dòng.\nVí dụ: Nếu nhân vật là "Bà Lão Ám Ảnh" và prompt là "Cận cảnh Bà Lão Ám Ảnh đang cười", kết quả sẽ là "Cận cảnh [BÀ_LÃO_ÁM_ẢNH] đang cười".`,
    buttonText: 'Định Danh Nhân Vật (Ảnh)'
  },
  {
    id: 8,
    title: 'Bước 8: Thay Thế Mô Tả (Ảnh)',
    description: 'Hệ thống sẽ tự động thay thế các tag nhân vật trong prompt ảnh bằng mô tả chi tiết đã được trích xuất ở Bước 4.',
    systemPrompt: `Bạn là một công cụ tự động hóa kịch bản. Bạn sẽ nhận được hai phần thông tin: (1) một văn bản chứa phần phân tích và danh sách hồ sơ nhân vật, và (2) một danh sách các image prompt đã được gắn thẻ. Nhiệm vụ của bạn là **chỉ tập trung vào phần "--- NHÂN VẬT ---"** trong văn bản đầu tiên. Hãy thay thế MỖI thẻ nhân vật (ví dụ: [TÊN_NHÂN_VẬT]) trong các prompt bằng MÔ TẢ ĐẦY ĐỦ, NGUYÊN GỐC tương ứng từ danh sách hồ sơ. KHÔNG được rút gọn hay thay đổi bất kỳ từ ngữ nào trong mô tả nhân vật. Trả về danh sách image prompt cuối cùng sau khi đã thay thế, mỗi prompt trên một dòng.`,
    buttonText: 'Thay Thế Mô Tả (Ảnh)'
  },
  {
    id: 9,
    title: 'Bước 9: Tối Ưu Hóa Image Prompts',
    description: 'AI sẽ review và tinh chỉnh lại các prompt ảnh đã được chèn mô tả để đảm bảo sự mượt mà và chất lượng cao nhất.',
    systemPrompt: `Bạn là một chuyên gia về prompt AI (Prompt Engineer). Bạn sẽ nhận được một danh sách các prompt ảnh đã được chèn mô tả nhân vật chi tiết. Nhiệm vụ của bạn là:\n1. Đọc và hiểu từng prompt.\n2. Tinh chỉnh câu chữ để mô tả nhân vật được tích hợp một cách mượt mà, tự nhiên vào trong prompt.\n3. Bổ sung thêm các chi tiết về ánh sáng, góc máy, không khí (mood), và phong cách nghệ thuật để tăng chất lượng và cảm xúc cho prompt.\n4. Trả về danh sách prompt đã được tối ưu, mỗi prompt trên một dòng.`,
    buttonText: 'Tối Ưu Prompt Ảnh'
  },
  {
    id: 10,
    title: 'Bước 10: Tối Ưu Hóa Video Prompts',
    description: 'Dựa trên các prompt ảnh đã được tối ưu, AI sẽ chuyển đổi và bổ sung các yếu tố chuyển động để tạo ra các prompt video/motion chất lượng cao.',
    systemPrompt: `Bạn là một chuyên gia về prompt AI (Prompt Engineer) chuyên về video. Bạn sẽ nhận được một danh sách các prompt ảnh đã được tối ưu hóa. Nhiệm vụ của bạn là chuyển đổi mỗi prompt ảnh thành một prompt video bằng cách thêm vào các chi tiết về chuyển động của máy quay (camera movement), hành động của nhân vật (character actions), và các hiệu ứng động (dynamic effects) để tạo ra một cảnh quay sống động. Giữ nguyên cốt lõi mô tả của prompt gốc. Trả về danh sách prompt video đã được tối ưu, mỗi prompt trên một dòng.`,
    buttonText: 'Tối Ưu Prompt Video'
  },
  {
    id: 11,
    title: 'Bước 11: Tách Lời Bình & Voiceover',
    description: 'Tự động tách riêng phần lời bình của từng cảnh từ kịch bản chi tiết để tiện cho việc thu âm.',
    systemPrompt: `Bạn là một trợ lý biên tập video. Từ kịch bản chi tiết được cung cấp, hãy trích xuất TOÀN BỘ và CHỈ phần "Lời bình (Voice-over)" của mỗi cảnh. Trả về dưới dạng một danh sách được đánh số thứ tự (1., 2., 3., ...). KHÔNG thêm bất kỳ mô tả, tiêu đề hay định dạng nào khác.`,
    buttonText: 'Tách Lời Bình'
  },
  {
    id: 12,
    title: 'Bước 12: Tạo Thumbnail & Metadata',
    description: 'AI sẽ đề xuất các ý tưởng thumbnail, tiêu đề, mô tả và tags cho video để tối ưu hóa SEO.',
    systemPrompt: `Bạn là một chuyên gia marketing YouTube. Dựa vào kịch bản tổng quan được cung cấp, hãy đề xuất:
1.  **Tiêu đề video (3 lựa chọn):** Ngắn gọn, hấp dẫn, chứa từ khóa.
2.  **Mô tả video:** Một đoạn văn ngắn (100-150 từ) tóm tắt nội dung và kêu gọi hành động.
3.  **Tags/Keywords:** Một danh sách các từ khóa liên quan.
4.  **Ý tưởng thumbnail (2 lựa chọn):** Mô tả rõ hình ảnh chủ đạo, dòng chữ (text) nổi bật, và phong cách thiết kế.`,
    buttonText: 'Tạo Thumbnail & Metadata'
  }
];

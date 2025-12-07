import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENT_ID = '7f7bfa59-a65b-4b38-b038-8e3cb6503af6';
const TOURNAMENT_NAME = 'SBP x DESTINY 9 BALL OPEN';

console.log('='.repeat(80));
console.log('🗑️  XÓA TẤT CẢ MATCHES CỦA GIẢI ' + TOURNAMENT_NAME);
console.log('='.repeat(80));

// 1. Kiểm tra số lượng matches hiện tại
console.log('\n1️⃣ Kiểm tra số lượng matches hiện tại...\n');

const { count: beforeCount, error: countError } = await supabase
  .from('matches')
  .select('id', { count: 'exact', head: true })
  .eq('tournament_id', TOURNAMENT_ID);

if (countError) {
  console.error('❌ Lỗi:', countError.message);
  process.exit(1);
}

console.log(`📊 Tìm thấy ${beforeCount} matches trong giải ${TOURNAMENT_NAME}`);

if (beforeCount === 0) {
  console.log('\n✅ Giải này không có matches nào để xóa!');
  process.exit(0);
}

// 2. Lấy thông tin chi tiết trước khi xóa
console.log('\n2️⃣ Phân tích matches trước khi xóa:\n');

const { data: matchDetails } = await supabase
  .from('matches')
  .select('bracket_type, bracket_group, round_number')
  .eq('tournament_id', TOURNAMENT_ID);

if (matchDetails) {
  const byBracket = matchDetails.reduce((acc, m) => {
    const key = m.bracket_type || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Phân bổ theo Bracket Type:');
  for (const [bracket, count] of Object.entries(byBracket).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${bracket}: ${count} matches`);
  }
  
  const byGroup = matchDetails.reduce((acc, m) => {
    const key = m.bracket_group || 'None';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Phân bổ theo Group:');
  for (const [group, count] of Object.entries(byGroup).sort()) {
    console.log(`   Group ${group}: ${count} matches`);
  }
}

// 3. Xác nhận trước khi xóa
console.log('\n' + '='.repeat(80));
console.log('⚠️  CẢNH BÁO: Bạn sắp xóa ' + beforeCount + ' matches!');
console.log('='.repeat(80));
console.log('Tournament: ' + TOURNAMENT_NAME);
console.log('ID: ' + TOURNAMENT_ID);
console.log('='.repeat(80));

// 4. Thực hiện xóa
console.log('\n3️⃣ Đang xóa matches...\n');

const { error: deleteError, count: deletedCount } = await supabase
  .from('matches')
  .delete({ count: 'exact' })
  .eq('tournament_id', TOURNAMENT_ID);

if (deleteError) {
  console.error('❌ Lỗi khi xóa:', deleteError.message);
  process.exit(1);
}

console.log(`✅ Đã xóa thành công ${deletedCount} matches!`);

// 5. Kiểm tra lại sau khi xóa
console.log('\n4️⃣ Kiểm tra lại sau khi xóa...\n');

const { count: afterCount } = await supabase
  .from('matches')
  .select('id', { count: 'exact', head: true })
  .eq('tournament_id', TOURNAMENT_ID);

console.log(`📊 Số matches còn lại: ${afterCount}`);

if (afterCount === 0) {
  console.log('\n✅ HOÀN TẤT! Đã xóa sạch tất cả matches của giải ' + TOURNAMENT_NAME);
  console.log('🎯 Bây giờ bạn có thể tạo lại bảng đấu mới!');
} else {
  console.log(`\n⚠️  Còn lại ${afterCount} matches chưa được xóa`);
}

console.log('\n' + '='.repeat(80));

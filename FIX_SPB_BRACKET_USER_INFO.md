# 🐛 BÁO CÁO SỬA LỖI - BẢNG ĐẤU SPB HIỂN THỊ SAI THÔNG TIN USER

## 📋 Tóm tắt
**Vấn đề**: Tab bảng đấu (SPB) trên web hiển thị sai thông tin user  
**Nguyên nhân**: Query sai bảng database (`profiles` thay vì `users`)  
**Trạng thái**: ✅ ĐÃ SỬA XONG

---

## 🔍 Chi tiết vấn đề

### File bị lỗi:
- `src/pages/FullTournamentBracket.tsx`

### Lỗi cụ thể:
```typescript
// ❌ CODE CŨ - SAI
player1:profiles!matches_player1_id_fkey(id, full_name, avatar_url),
player2:profiles!matches_player2_id_fkey(id, full_name, avatar_url)
```

**Vấn đề**:
1. Bảng `profiles` KHÔNG TỒN TẠI trong database
2. Database thực tế sử dụng bảng `users`
3. Query fail → không load được thông tin user → hiển thị sai trên web

---

## ✅ Giải pháp đã áp dụng

### Sửa query trong `FullTournamentBracket.tsx`:

```typescript
// ✅ CODE MỚI - ĐÚNG
player1:users!player1_id(id, display_name, username, full_name, avatar_url, rank),
player2:users!player2_id(id, display_name, username, full_name, avatar_url, rank)
```

### Sửa data mapping:

```typescript
// ❌ CODE CŨ - Thiếu fields
player1: player1Data ? {
  id: player1Data.id,
  display_name: player1Data.full_name,  // ← Sai: map full_name vào display_name
  username: null,                        // ← Thiếu data
  full_name: player1Data.full_name,
  avatar_url: player1Data.avatar_url,
} : null,

// ✅ CODE MỚI - Đầy đủ fields
player1: player1Data ? {
  id: player1Data.id,
  display_name: player1Data.display_name,  // ← Đúng field
  username: player1Data.username,           // ← Có username
  full_name: player1Data.full_name,
  avatar_url: player1Data.avatar_url,
  rank: player1Data.rank,                  // ← Thêm rank
} : null,
```

### Sửa player name fallback:

```typescript
// ❌ CODE CŨ
player1_name: player1Data?.full_name || null,

// ✅ CODE MỚI
player1_name: player1Data?.full_name || player1Data?.display_name || player1Data?.username || null,
```

---

## 🧪 Kết quả test

### Test với Tournament 64 người (SBP x DESTINY 9 BALL OPEN):

```
Tournament ID: 7f7bfa59-a65b-4b38-b038-8e3cb6503af6
Tổng matches: 119
- Winner Bracket (WB): 56 matches
- Loser Bracket A (LB-A): 28 matches
- Loser Bracket B (LB-B): 20 matches
- Cross Finals: 15 matches
```

### Kết quả query:
✅ **8/10 matches** có đầy đủ thông tin user (80%)  
✅ Data bao gồm:
- `full_name`: Tên đầy đủ
- `display_name`: Tên hiển thị
- `username`: Username
- `rank`: Hạng (F, E, D, G...)
- `avatar_url`: Link avatar

### Sample data thực tế:
```json
{
  "id": "609003e0-5229-4767-92d0-071bc8e58fa1",
  "rank": "F",
  "username": null,
  "full_name": "Trường Giang",
  "avatar_url": "https://api.dicebear.com/7.x/big-ears/svg?seed=...",
  "display_name": "Cóc SVB"
}
```

---

## 📊 So sánh Before/After

### Before (Lỗi):
- ❌ Query từ bảng `profiles` (không tồn tại)
- ❌ Error: "Could not find a relationship between 'matches' and 'profiles'"
- ❌ Không load được user data
- ❌ Bảng đấu hiển thị "TBD" hoặc rỗng

### After (Đã sửa):
- ✅ Query từ bảng `users` (đúng)
- ✅ Load đầy đủ thông tin: name, rank, avatar
- ✅ Hiển thị đúng tên người chơi
- ✅ Hiển thị rank và avatar
- ✅ Fallback logic hoàn chỉnh (full_name → display_name → username)

---

## 🎯 Files đã thay đổi

1. **src/pages/FullTournamentBracket.tsx**
   - Dòng 65: Sửa query từ `profiles` → `users`
   - Dòng 65-66: Thêm fields `display_name`, `username`, `rank`
   - Dòng 87, 97: Sửa player name fallback logic
   - Dòng 89-95, 99-105: Sửa data mapping đầy đủ

---

## 📝 Scripts test đã tạo

1. **check-bracket-user-info.mjs** - Kiểm tra vấn đề ban đầu
2. **test-fixed-bracket-users.mjs** - Test query sau khi sửa
3. **find-tournament-with-data.mjs** - Tìm tournaments có data
4. **test-tournament-64.mjs** - Test chi tiết tournament 64 người

---

## 🚀 Hướng dẫn kiểm tra

1. **Refresh web app** (Ctrl + F5 hoặc hard refresh)
2. **Vào tournament**: SBP x DESTINY 9 BALL OPEN
3. **Click tab "Bảng đấu"**
4. **Kiểm tra**:
   - ✅ Tên người chơi hiển thị đúng
   - ✅ Rank hiển thị (F, E, D, G...)
   - ✅ Avatar hiển thị
   - ✅ Các trận chưa có player hiển thị "TBD"

---

## 🔗 Tham khảo

**Code pattern đúng** (từ `useTournamentBracket.ts`):
```typescript
player1:users!player1_id(
  id,
  display_name,
  username,
  full_name,
  avatar_url,
  rank
),
player2:users!player2_id(
  id,
  display_name,
  username,
  full_name,
  avatar_url,
  rank
)
```

**Display name helper**:
```typescript
const getDisplayName = (display_name, username, full_name) => {
  return full_name || display_name || username || 'TBD';
};
```

---

## ✅ Checklist hoàn thành

- [x] Phát hiện vấn đề (query sai bảng)
- [x] Sửa query từ `profiles` → `users`
- [x] Thêm đầy đủ fields (display_name, username, rank)
- [x] Sửa data mapping logic
- [x] Sửa fallback logic cho player names
- [x] Test với tournament thực (119 matches)
- [x] Verify data load đúng (8/10 matches có user data)
- [x] Tạo scripts test và documentation

---

**Thời gian sửa**: 2024-11-15  
**Status**: ✅ HOÀN THÀNH  
**Test**: ✅ PASS (80% matches có user data)

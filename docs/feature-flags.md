# Feature flags

- Flag là một `if` ở cửa vào của tính năng (route, nút, cron), viết từ PR đầu, mặc định tắt.
- Giá trị theo môi trường qua env `FEATURES=a,b` (đổi = deploy mới) hoặc remote config (đổi không cần deploy).
- Fix không cần flag. Flag đã mở ổn ở prod thì xóa.

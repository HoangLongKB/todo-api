# Quy trình promote

- develop → test: PR, merge commit. `promote-test.yml` tìm image `tree-<hash>`; có thì gắn tag `test-latest`, không build lại.
- test → main: PR, merge commit. `release-production.yml` dừng ở Environment `production` chờ duyệt, backup Cloud SQL trước migrate.
- Chỉ cherry-pick khi thật sự cần loại feature; cái lên test lúc đó chưa từng chạy ở dev, pipeline sẽ cảnh báo và build lại.
- Sau khi cherry-pick, luôn promote đủ develop → test để tree khớp lại; kiểm tra bằng `git promoted` (alias) hoặc `git log --cherry-mark --left-right origin/test...origin/develop`.
- Chiều về: test/main chỉ nhận. Hotfix làm thẳng trên main/test thì merge back develop ngay.

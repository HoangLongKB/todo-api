# Quy trình promote

- develop → test: PR, merge commit. `promote-test.yml` tìm image `tree-<hash>`; có thì gắn tag `test-latest`, không build lại.
- test → main: PR, merge commit. `release-production.yml` dừng ở Environment `production` chờ duyệt, backup Cloud SQL trước migrate.
- Chỉ cherry-pick khi thật sự cần loại feature; cái lên test lúc đó chưa từng chạy ở dev, pipeline sẽ cảnh báo và build lại.

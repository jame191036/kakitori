import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="container page" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <p className="kana" style={{ fontSize: '5rem', color: 'var(--accent)' }} lang="ja">
        ？
      </p>
      <h1 className="page-title">ไม่พบหน้านี้</h1>
      <p className="muted">ลิงก์อาจผิด หรือหน้านี้ยังไม่เปิดให้ใช้งาน</p>
      <Link to="/" className="btn btn-primary">
        กลับหน้าแรก
      </Link>
    </div>
  );
}

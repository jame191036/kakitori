import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import NotFoundPage from '../pages/NotFoundPage';

export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <div className="container page" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <h1 className="page-title">เกิดข้อผิดพลาด</h1>
      <p className="muted">
        โหลดหน้านี้ไม่สำเร็จ ถ้าออฟไลน์อยู่ ลองเชื่อมต่ออินเทอร์เน็ตแล้วโหลดใหม่อีกครั้ง
      </p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          โหลดใหม่
        </button>
        <Link to="/" className="btn">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}

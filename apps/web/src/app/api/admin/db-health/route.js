import { checkDbIndexes } from '@/app/api/utils/db-health';

export async function GET() {
  try {
    const report = await checkDbIndexes();
    return Response.json({ success: true, data: report });
  } catch (e) {
    return Response.json({ success: false, error: { code: 'DB_HEALTH_ERROR', message: e.message } }, { status: 500 });
  }
}

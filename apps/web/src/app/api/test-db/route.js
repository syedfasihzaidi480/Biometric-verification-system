// This test endpoint has been disabled and should not be used in production.
// It intentionally returns 404 to prevent accidental exposure of database details.

export async function GET() {
  return Response.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'This endpoint is disabled',
    },
  }, { status: 404 });
}

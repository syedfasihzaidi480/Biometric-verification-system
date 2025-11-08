import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Admin endpoint to retrieve document images
 * GET /api/admin/document-images?userId=xxx&documentType=xxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentType = searchParams.get('documentType'); // optional filter

    if (!userId) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const collection = db.collection('document_images');
    
    const query = { user_id: userId };
    if (documentType) {
      query.document_type = documentType;
    }

    const images = await collection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Remove image_buffer from response (too large) but keep metadata
    const imagesWithoutBuffer = images.map(image => {
      const { image_buffer, ...rest } = image;
      return {
        ...rest,
        has_image_buffer: !!image_buffer,
        image_buffer_size: image_buffer ? image_buffer.length : 0
      };
    });

    return Response.json({
      success: true,
      data: {
        userId,
        documentType: documentType || 'all',
        count: imagesWithoutBuffer.length,
        images: imagesWithoutBuffer
      }
    });

  } catch (error) {
    console.error('Document images retrieval error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * Admin endpoint to retrieve a specific document image with image data
 * POST /api/admin/document-images
 * Body: { imageId: string, includeImage: boolean }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { imageId, includeImage } = body;

    if (!imageId) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_IMAGE_ID',
          message: 'Image ID is required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const collection = db.collection('document_images');
    
    const image = await collection.findOne({ id: imageId });

    if (!image) {
      return Response.json({
        success: false,
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Document image not found'
        }
      }, { status: 404 });
    }

    // Optionally exclude image buffer for lighter response
    if (!includeImage) {
      const { image_buffer, ...rest } = image;
      return Response.json({
        success: true,
        data: {
          ...rest,
          has_image_buffer: !!image_buffer,
          image_buffer_size: image_buffer ? image_buffer.length : 0
        }
      });
    }

    return Response.json({
      success: true,
      data: image
    });

  } catch (error) {
    console.error('Document image retrieval error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

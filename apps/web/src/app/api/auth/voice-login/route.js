import { upload } from '@/app/api/utils/upload';
import { getMongoDb } from '@/app/api/utils/mongo';
import { verifyVoiceLogin } from '@/server/services/voiceVerificationService';

const ALLOWED_QUESTIONS = new Set([1, 2]);

export async function POST(request) {
  try {
    const parsed = await parseIncomingRequest(request);

    if (!parsed.ok) {
      return Response.json(parsed.body, { status: parsed.status });
    }

    const { identifier, questionNumber, audioBuffer, audioBase64, audioFormat } = parsed.data;

    const db = await getMongoDb();
    const usersCollection = db.collection('users');
    const voiceProfilesCollection = db.collection('voice_profiles');
    const voiceEnrollmentSamplesCollection = db.collection('voice_enrollment_samples');
    const auditLogsCollection = db.collection('audit_logs');

    const normalizedIdentifier = identifier.trim();
    const normalizedPhone = normalizedIdentifier.replace(/[\s\-().]/g, '');
    const identifierRegex = new RegExp(`^${escapeRegExp(normalizedIdentifier)}$`, 'i');

    const user = await usersCollection.findOne({
      $or: [
        { email: normalizedIdentifier },
        { email: identifierRegex },
        { phone: normalizedIdentifier },
        { phone: normalizedPhone },
      ],
    });

    if (!user) {
      await auditLogsCollection.insertOne({
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        event_type: 'voice_login_failed',
        user_id: null,
        identifier: normalizedIdentifier,
        reason: 'user_not_found',
        timestamp: new Date().toISOString(),
        ip_address: getIpAddress(request),
      });

      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: 'No user found with this email or phone number.',
          },
        },
        { status: 404 }
      );
    }

    const voiceProfile = await voiceProfilesCollection.findOne({ user_id: user.id });

    if (!voiceProfile || !voiceProfile.is_enrolled || !voiceProfile.voice_model_ref) {
      await auditLogsCollection.insertOne({
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        event_type: 'voice_login_failed',
        user_id: user.id,
        identifier: normalizedIdentifier,
        reason: 'voice_not_enrolled',
        timestamp: new Date().toISOString(),
        ip_address: getIpAddress(request),
      });

      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: 'Voice enrollment not completed. Please enroll your voice first.',
            needsEnrollment: true,
          },
        },
        { status: 400 }
      );
    }

    const audioBase64Payload =
      audioBase64 || (audioBuffer ? audioBuffer.toString('base64') : null);

    if (!audioBase64Payload) {
      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: 'Unable to process audio payload.',
          },
        },
        { status: 400 }
      );
    }

    const uploadResult = await upload(
      audioBase64
        ? { base64: audioBase64Payload, folder: 'voice-login-attempts' }
        : { buffer: audioBuffer, folder: 'voice-login-attempts' }
    );

    if (!uploadResult || uploadResult.error || !uploadResult.url) {
      console.error('[VOICE_LOGIN] Upload failed:', uploadResult?.error);
      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: 'Failed to store audio sample for verification.',
          },
        },
        { status: 500 }
      );
    }

    const expectedAnswer = getExpectedAnswerForQuestion(questionNumber, user);

    if (!expectedAnswer) {
      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: 'User profile is missing required information for voice verification.',
          },
        },
        { status: 422 }
      );
    }

    const enrollmentSamples = await voiceEnrollmentSamplesCollection
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .limit(5)
      .project({ id: 1, audio_buffer: 1, file_size: 1, created_at: 1, sample_number: 1 })
      .toArray();

    let verification;

    try {
      verification = await verifyVoiceLogin({
        audioBase64: audioBase64Payload,
        audioUrl: uploadResult.url,
        audioFormat,
        user,
        voiceProfile,
        questionNumber,
        expectedAnswer,
        enrollmentSamples,
      });
    } catch (error) {
      console.error('[VOICE_LOGIN] Voice verification service error:', error);

      await auditLogsCollection.insertOne({
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        event_type: 'voice_login_failed',
        user_id: user.id,
        identifier: normalizedIdentifier,
        question_number: questionNumber,
        reason: 'ml_service_error',
        details: {
          code: error?.code || 'VOICE_SERVICE_ERROR',
          provider: error?.provider || null,
        },
        timestamp: new Date().toISOString(),
        ip_address: getIpAddress(request),
      });

      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message:
              error?.message ||
              'Voice verification service is unavailable. Please try again in a moment.',
          },
        },
        { status: 502 }
      );
    }

    const {
      isMatch,
      answersCorrect,
      matchScore,
      provider,
      transcribedAnswer,
      analysis,
    } = verification;

    if (!isMatch || !answersCorrect) {
      await auditLogsCollection.insertOne({
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        event_type: 'voice_login_failed',
        user_id: user.id,
        identifier: normalizedIdentifier,
        question_number: questionNumber,
        reason: isMatch ? 'answer_mismatch' : 'voice_mismatch',
        match_score: matchScore,
        provider,
        analysis: analysis || null,
        timestamp: new Date().toISOString(),
        ip_address: getIpAddress(request),
      });

      return Response.json(
        {
          success: false,
          data: {
            verified: false,
            message: isMatch
              ? 'Spoken answers do not match our records. Please try again.'
              : 'Voice does not match enrolled profile. Please try again.',
            matchScore,
            provider,
            transcribedAnswer: transcribedAnswer || null,
          },
        },
        { status: 401 }
      );
    }

    await auditLogsCollection.insertOne({
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      event_type: 'voice_login_success',
      user_id: user.id,
      identifier: normalizedIdentifier,
      question_number: questionNumber,
      match_score: matchScore,
      provider,
      analysis: analysis || null,
      audio_url: uploadResult.url,
      timestamp: new Date().toISOString(),
      ip_address: getIpAddress(request),
    });

    if (verification.provider === 'internal-fingerprint') {
      console.log('[VOICE_LOGIN] Fallback analysis', {
        userId: user.id,
        questionNumber,
        matchScore,
        analysis,
      });
    }

    return Response.json({
      success: true,
      data: {
        verified: true,
        matchScore,
        provider,
        transcribedAnswer: transcribedAnswer || null,
        analysis: analysis || null,
        questionNumber,
        user: {
          id: user.id,
          auth_user_id: user.auth_user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          date_of_birth: user.date_of_birth,
          preferred_language: user.preferred_language,
        },
      },
    });
  } catch (error) {
    console.error('[VOICE_LOGIN] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        data: {
          verified: false,
          message: 'An unexpected error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : null,
        },
      },
      { status: 500 }
    );
  }
}

async function parseIncomingRequest(request) {
  const contentType = request.headers.get('content-type') || '';
  let identifier = null;
  let questionNumber = null;
  let audioBuffer = null;
  let audioBase64 = null;
  let audioFormat = 'audio/m4a';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      identifier = formData.get('identifier')?.toString() ?? null;
      questionNumber = parseInt(formData.get('questionNumber'), 10);
      const audioFile = formData.get('audioFile');

      if (audioFile) {
        audioFormat = audioFile.type || audioFormat;
        const arrayBuffer = await audioFile.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        audioBase64 = audioBuffer.toString('base64');
      }
    } else {
      const data = await request.json();
      identifier = data?.identifier ? String(data.identifier) : null;
      questionNumber = parseInt(data?.questionNumber, 10);
      audioFormat = data?.audioFormat || audioFormat;
      audioBase64 = data?.audioBase64 || null;

      if (audioBase64) {
        const cleaned = cleanupBase64(audioBase64);
        audioBase64 = cleaned;
        audioBuffer = Buffer.from(cleaned, 'base64');
      }
    }
  } catch (error) {
    console.error('[VOICE_LOGIN] Failed to parse request body:', error);
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        data: {
          verified: false,
          message: 'Invalid request payload. Unable to parse voice login submission.',
        },
      },
    };
  }

  if (!identifier || Number.isNaN(questionNumber)) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        data: {
          verified: false,
          message: 'Identifier and question number are required.',
        },
      },
    };
  }

  if (!ALLOWED_QUESTIONS.has(questionNumber)) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        data: {
          verified: false,
          message: 'Unsupported question number provided.',
        },
      },
    };
  }

  if (!audioBuffer || !audioBuffer.length) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        data: {
          verified: false,
          message: 'Audio data is required for voice verification.',
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      identifier,
      questionNumber,
      audioBuffer,
      audioBase64,
      audioFormat,
    },
  };
}

function getExpectedAnswerForQuestion(questionNumber, user) {
  if (questionNumber === 1) {
    return user?.name?.trim() || null;
  }

  if (questionNumber === 2) {
    return formatDateForVoice(user?.date_of_birth);
  }

  return null;
}

function formatDateForVoice(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeRegExp(str = '') {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getIpAddress(request) {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function cleanupBase64(value) {

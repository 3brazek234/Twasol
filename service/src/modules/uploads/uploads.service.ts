import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { generateUploadUrl } from '../../common/utils/r2';

export class UploadsService {
  static async getPresignedUrl(userId: string, data: { fileName: string; fileType: string; conversationId: string }) {
    const { fileName, fileType, conversationId } = data;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });

    if (!participant) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        throw AppError.forbidden('Not a participant in this conversation');
      }
    }

    const key = `conversations/${conversationId}/attachments/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadUrlPayload = await generateUploadUrl(key, fileType);

    let publicUrl = '';
    try {
      const payloadObj = JSON.parse(uploadUrlPayload);
      if (payloadObj.public_id && payloadObj.url.includes('cloudinary')) {
        const ext = fileName.includes('.') ? `.${fileName.split('.').pop()?.toLowerCase()}` : '';
        publicUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${payloadObj.public_id}${ext}`;
      }
    } catch {
      publicUrl = uploadUrlPayload;
    }

    return { uploadUrl: uploadUrlPayload, publicUrl, fileKey: key };
  }
}

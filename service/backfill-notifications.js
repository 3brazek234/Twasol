const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifications = await prisma.notification.findMany();
  
  let updatedCount = 0;
  for (const notif of notifications) {
    let payload = notif.payload || {};
    let needsUpdate = false;
    
    if (!payload.titleAr || !payload.messageAr) {
      needsUpdate = true;
      
      switch (notif.type) {
        case 'NEW_MESSAGE':
          payload.titleAr = payload.titleAr || 'رسالة جديدة';
          payload.messageAr = payload.messageAr || 'لديك رسالة جديدة في المحادثة.';
          break;
        case 'OFFER_RECEIVED':
          payload.titleAr = payload.titleAr || 'عرض جديد 💰';
          payload.messageAr = payload.messageAr || 'لقد تلقيت عرضاً مالياً جديداً للمهمة.';
          break;
        case 'OFFER_ACCEPTED':
          payload.titleAr = payload.titleAr || 'تم قبول العرض ✅';
          payload.messageAr = payload.messageAr || 'تم قبول عرضك المالي.';
          break;
        case 'JOB_COMPLETED':
          payload.titleAr = payload.titleAr || 'تم إتمام المهمة ✓';
          payload.messageAr = payload.messageAr || 'أكد الموكِّل إتمام المهمة.';
          break;
        case 'JOB_INVITE':
          payload.titleAr = payload.titleAr || 'دعوة جديدة 📨';
          payload.messageAr = payload.messageAr || 'تمت دعوتك للتقديم على مهمة.';
          break;
        case 'NEW_JOB':
          payload.titleAr = payload.titleAr || 'مهمة جديدة متاحة 💼';
          payload.messageAr = payload.messageAr || 'تم نشر مهمة جديدة في المحكمة.';
          break;
        default:
          payload.titleAr = payload.titleAr || 'إشعار جديد';
          payload.messageAr = payload.messageAr || 'لديك إشعار جديد في وكيل.';
      }
      
      await prisma.notification.update({
        where: { id: notif.id },
        data: { payload }
      });
      updatedCount++;
    }
  }
  
  console.log(`Backfilled ${updatedCount} old notifications with titleAr and messageAr.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

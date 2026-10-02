import { PrismaClient, Role, CourtType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.lawyerCourt.deleteMany();
  await prisma.court.deleteMany();
  await prisma.governorate.deleteMany();
  await prisma.user.deleteMany();

  const governoratesData = [
    { nameAr: 'القاهرة', nameEn: 'Cairo' },
    { nameAr: 'الجيزة', nameEn: 'Giza' },
    { nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
    { nameAr: 'القليوبية', nameEn: 'Qalyubia' },
    { nameAr: 'الشرقية', nameEn: 'Sharqia' },
    { nameAr: 'المنوفية', nameEn: 'Monufia' },
    { nameAr: 'الغربية', nameEn: 'Gharbia' },
    { nameAr: 'كفر الشيخ', nameEn: 'Kafr el-Sheikh' },
    { nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
    { nameAr: 'دمياط', nameEn: 'Damietta' },
    { nameAr: 'بورسعيد', nameEn: 'Port Said' },
    { nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
    { nameAr: 'السويس', nameEn: 'Suez' },
    { nameAr: 'شمال سيناء', nameEn: 'North Sinai' },
    { nameAr: 'جنوب سيناء', nameEn: 'South Sinai' },
    { nameAr: 'البحيرة', nameEn: 'Beheira' },
    { nameAr: 'المنيا', nameEn: 'Minya' },
    { nameAr: 'أسيوط', nameEn: 'Asyut' },
    { nameAr: 'سوهاج', nameEn: 'Sohag' },
    { nameAr: 'قنا', nameEn: 'Qena' },
    { nameAr: 'الأقصر', nameEn: 'Luxor' },
    { nameAr: 'أسوان', nameEn: 'Aswan' },
    { nameAr: 'البحر الأحمر', nameEn: 'Red Sea' },
    { nameAr: 'الوادي الجديد', nameEn: 'New Valley' },
    { nameAr: 'مطروح', nameEn: 'Matrouh' },
    { nameAr: 'الفيوم', nameEn: 'Faiyum' },
    { nameAr: 'بني سويف', nameEn: 'Beni Suef' },
  ];

  const governorates = await Promise.all(
    governoratesData.map(g => prisma.governorate.create({ data: g }))
  );
  const gov = Object.fromEntries(governorates.map(g => [g.nameEn, g]));
  console.log(`Created ${governorates.length} governorates.`);

  await prisma.court.create({
    data: { nameAr: 'محكمة النقض', nameEn: 'Court of Cassation', type: CourtType.CASSATION }
  });

  const appealData = [
    { nameAr: 'محكمة استئناف القاهرة', nameEn: 'Cairo Court of Appeal', govKey: 'Cairo' },
    { nameAr: 'محكمة استئناف الإسكندرية', nameEn: 'Alexandria Court of Appeal', govKey: 'Alexandria' },
    { nameAr: 'محكمة استئناف طنطا', nameEn: 'Tanta Court of Appeal', govKey: 'Gharbia' },
    { nameAr: 'محكمة استئناف المنصورة', nameEn: 'Mansoura Court of Appeal', govKey: 'Dakahlia' },
    { nameAr: 'محكمة استئناف الإسماعيلية', nameEn: 'Ismailia Court of Appeal', govKey: 'Ismailia' },
    { nameAr: 'محكمة استئناف بني سويف', nameEn: 'Beni Suef Court of Appeal', govKey: 'Beni Suef' },
    { nameAr: 'محكمة استئناف أسيوط', nameEn: 'Asyut Court of Appeal', govKey: 'Asyut' },
    { nameAr: 'محكمة استئناف قنا', nameEn: 'Qena Court of Appeal', govKey: 'Qena' },
  ];
  await Promise.all(appealData.map(a => prisma.court.create({
    data: { nameAr: a.nameAr, nameEn: a.nameEn, type: CourtType.APPEAL, governorateId: gov[a.govKey].id }
  })));

  const primaryData = [
    { nameAr: 'محكمة القاهرة الابتدائية', nameEn: 'Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة شمال القاهرة الابتدائية', nameEn: 'North Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة جنوب القاهرة الابتدائية', nameEn: 'South Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة الجيزة الابتدائية', nameEn: 'Giza Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة شمال الجيزة الابتدائية', nameEn: 'North Giza Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة جنوب الجيزة الابتدائية', nameEn: 'South Giza Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة الإسكندرية الابتدائية', nameEn: 'Alexandria Primary Court', govKey: 'Alexandria' },
    { nameAr: 'محكمة شمال الإسكندرية الابتدائية', nameEn: 'North Alexandria Primary Court', govKey: 'Alexandria' },
    { nameAr: 'محكمة بنها الابتدائية', nameEn: 'Banha Primary Court', govKey: 'Qalyubia' },
    { nameAr: 'محكمة شبين القناطر الابتدائية', nameEn: 'Shibin al-Qanater Primary Court', govKey: 'Qalyubia' },
    { nameAr: 'محكمة الزقازيق الابتدائية', nameEn: 'Zagazig Primary Court', govKey: 'Sharqia' },
    { nameAr: 'محكمة شبين الكوم الابتدائية', nameEn: 'Shibin el-Kom Primary Court', govKey: 'Monufia' },
    { nameAr: 'محكمة طنطا الابتدائية', nameEn: 'Tanta Primary Court', govKey: 'Gharbia' },
    { nameAr: 'محكمة كفر الشيخ الابتدائية', nameEn: 'Kafr el-Sheikh Primary Court', govKey: 'Kafr el-Sheikh' },
    { nameAr: 'محكمة المنصورة الابتدائية', nameEn: 'Mansoura Primary Court', govKey: 'Dakahlia' },
    { nameAr: 'محكمة ميت غمر الابتدائية', nameEn: 'Mit Ghamr Primary Court', govKey: 'Dakahlia' },
    { nameAr: 'محكمة دمياط الابتدائية', nameEn: 'Damietta Primary Court', govKey: 'Damietta' },
    { nameAr: 'محكمة بورسعيد الابتدائية', nameEn: 'Port Said Primary Court', govKey: 'Port Said' },
    { nameAr: 'محكمة الإسماعيلية الابتدائية', nameEn: 'Ismailia Primary Court', govKey: 'Ismailia' },
    { nameAr: 'محكمة السويس الابتدائية', nameEn: 'Suez Primary Court', govKey: 'Suez' },
    { nameAr: 'محكمة دمنهور الابتدائية', nameEn: 'Damanhur Primary Court', govKey: 'Beheira' },
    { nameAr: 'محكمة المنيا الابتدائية', nameEn: 'Minya Primary Court', govKey: 'Minya' },
    { nameAr: 'محكمة أسيوط الابتدائية', nameEn: 'Asyut Primary Court', govKey: 'Asyut' },
    { nameAr: 'محكمة سوهاج الابتدائية', nameEn: 'Sohag Primary Court', govKey: 'Sohag' },
    { nameAr: 'محكمة قنا الابتدائية', nameEn: 'Qena Primary Court', govKey: 'Qena' },
    { nameAr: 'محكمة الأقصر الابتدائية', nameEn: 'Luxor Primary Court', govKey: 'Luxor' },
    { nameAr: 'محكمة أسوان الابتدائية', nameEn: 'Aswan Primary Court', govKey: 'Aswan' },
    { nameAr: 'محكمة الفيوم الابتدائية', nameEn: 'Faiyum Primary Court', govKey: 'Faiyum' },
    { nameAr: 'محكمة بني سويف الابتدائية', nameEn: 'Beni Suef Primary Court', govKey: 'Beni Suef' },
    { nameAr: 'المحكمة الابتدائية', nameEn: 'Beni Suef General Primary Court', govKey: 'Beni Suef' },
    { nameAr: 'محكمة مطروح الابتدائية', nameEn: 'Matrouh Primary Court', govKey: 'Matrouh' },
    { nameAr: 'محكمة الوادي الجديد الابتدائية', nameEn: 'New Valley Primary Court', govKey: 'New Valley' },
    { nameAr: 'محكمة شرم الشيخ الابتدائية', nameEn: 'Sharm el-Sheikh Primary Court', govKey: 'South Sinai' },
    { nameAr: 'محكمة العريش الابتدائية', nameEn: 'Arish Primary Court', govKey: 'North Sinai' },
    { nameAr: 'محكمة الغردقة الابتدائية', nameEn: 'Hurghada Primary Court', govKey: 'Red Sea' },
  ];
  const primaries = await Promise.all(
    primaryData.map(p => prisma.court.create({
      data: { nameAr: p.nameAr, nameEn: p.nameEn, type: CourtType.PRIMARY, governorateId: gov[p.govKey].id }
    }))
  );
  const primaryMap = Object.fromEntries(primaries.map(p => [p.nameEn, p]));

  const partialData = [
    { nameAr: 'محكمة مدينة نصر الجزئية', nameEn: 'Madinat Nasr Partial Court', govKey: 'Cairo', parentEn: 'Cairo Primary Court' },
    { nameAr: 'محكمة الزيتون الجزئية', nameEn: 'Zaytoun Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة المطرية الجزئية', nameEn: 'Matariya Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة حلوان الجزئية', nameEn: 'Helwan Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة المعادي الجزئية', nameEn: 'Maadi Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة عابدين الجزئية', nameEn: 'Abdin Partial Court', govKey: 'Cairo', parentEn: 'Cairo Primary Court' },
    { nameAr: 'محكمة الأميرية الجزئية', nameEn: 'Amiriya Partial Court', govKey: 'Cairo', parentEn: 'Cairo Primary Court' },
    { nameAr: 'محكمة شبرا الجزئية', nameEn: 'Shubra Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة بولاق الدكرور الجزئية', nameEn: 'Bulaq Dakrur Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة الدقي الجزئية', nameEn: 'Dokki Partial Court', govKey: 'Giza', parentEn: 'Giza Primary Court' },
    { nameAr: 'محكمة العمرانية الجزئية', nameEn: 'Umraniya Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة أكتوبر الجزئية', nameEn: '6th of October Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة الشيخ زايد الجزئية', nameEn: 'Sheikh Zayed Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة المنتزه الجزئية', nameEn: 'Montaza Partial Court', govKey: 'Alexandria', parentEn: 'North Alexandria Primary Court' },
    { nameAr: 'محكمة سيدي جابر الجزئية', nameEn: 'Sidi Gaber Partial Court', govKey: 'Alexandria', parentEn: 'Alexandria Primary Court' },
    { nameAr: 'محكمة الإبراهيمية الجزئية', nameEn: 'Ibrahimiya Partial Court', govKey: 'Alexandria', parentEn: 'Alexandria Primary Court' },
    { nameAr: 'محكمة طلخا الجزئية', nameEn: 'Talha Partial Court', govKey: 'Dakahlia', parentEn: 'Mansoura Primary Court' },
    { nameAr: 'محكمة بلقاس الجزئية', nameEn: 'Bilqas Partial Court', govKey: 'Dakahlia', parentEn: 'Mansoura Primary Court' },
    { nameAr: 'محكمة سمنود الجزئية', nameEn: 'Samannud Partial Court', govKey: 'Gharbia', parentEn: 'Tanta Primary Court' },
    { nameAr: 'محكمة المحلة الكبرى الجزئية', nameEn: 'Mahalla al-Kubra Partial Court', govKey: 'Gharbia', parentEn: 'Tanta Primary Court' },
    { nameAr: 'محكمة بلبيس الجزئية', nameEn: 'Belbeis Partial Court', govKey: 'Sharqia', parentEn: 'Zagazig Primary Court' },
    { nameAr: 'محكمة أبو حماد الجزئية', nameEn: 'Abu Hammad Partial Court', govKey: 'Sharqia', parentEn: 'Zagazig Primary Court' },
    { nameAr: 'محكمة منوف الجزئية', nameEn: 'Menouf Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة السادات الجزئية', nameEn: 'Sadat Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة بندر ومركز المنيا الجزئية', nameEn: 'Minya City and Center Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة أبو قرقاص الجزئية', nameEn: 'Abu Qurqas Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة ملوي الجزئية', nameEn: 'Mallawi Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة سمالوط الجزئية', nameEn: 'Samalut Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة بني مزار الجزئية', nameEn: 'Beni Mazar Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة العدوة الجزئية', nameEn: 'El Adwa Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة مغاغة الجزئية', nameEn: 'Maghagha Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة دير مواس الجزئية', nameEn: 'Deir Mawas Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة مطاي الجزئية', nameEn: 'Matay Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة ديروط الجزئية', nameEn: 'Dayrut Partial Court', govKey: 'Asyut', parentEn: 'Asyut Primary Court' },
    { nameAr: 'محكمة أبنوب الجزئية', nameEn: 'Abnub Partial Court', govKey: 'Asyut', parentEn: 'Asyut Primary Court' },
    { nameAr: 'محكمة أخميم الجزئية', nameEn: 'Akhmim Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة طهطا الجزئية', nameEn: 'Tahta Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة بندر ومركز قنا الجزئية', nameEn: 'Qena City and Center Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة مركز بني سويف الجزئية', nameEn: 'Beni Suef Center Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الأسرة ببني سويف', nameEn: 'Beni Suef Family Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الواسطى الجزئية', nameEn: 'El Wasta Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة ناصر الجزئية (بوش)', nameEn: 'Nasser (Boush) Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة إهناسيا الجزئية', nameEn: 'Ihnasia Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة ببا الجزئية', nameEn: 'Biba Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الفشن الجزئية', nameEn: 'El Fashn Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة سمسطا الجزئية', nameEn: 'Sumusta Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'المحكمة الجزئية', nameEn: 'Beni Suef General Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
  ];
  await Promise.all(partialData.map(p => prisma.court.create({
    data: {
      nameAr: p.nameAr, nameEn: p.nameEn, type: CourtType.PARTIAL,
      governorateId: gov[p.govKey].id,
      parentCourtId: primaryMap[p.parentEn]?.id,
    }
  })));


  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: { fullName: 'مدير النظام', email: 'admin@wakeel.app', passwordHash, role: Role.ADMIN, isActive: true, verificationStatus: 'APPROVED' },
  });
  await Promise.all([
    { fullName: 'أحمد محمود', email: 'ahmed@wakeel.app', barNumber: 'EG-CAI-001' },
    { fullName: 'منى حسن', email: 'mona@wakeel.app', barNumber: 'EG-GIZ-002' },
    { fullName: 'خالد إبراهيم', email: 'khaled@wakeel.app', barNumber: 'EG-ALX-003' },
  ].map(l => prisma.user.create({ data: { ...l, passwordHash, role: Role.LAWYER, isActive: true, verificationStatus: 'APPROVED' as any } })));

  const totalCourts = await prisma.court.count();
  console.log(`Seed complete: ${governorates.length} governorates, ${totalCourts} courts total.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

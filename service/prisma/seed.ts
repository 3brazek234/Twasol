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

  // ─── 1. Supreme / Cassation Courts (محكمة النقض والمحكمة الإدارية العليا) ────
  await prisma.court.createMany({
    data: [
      { nameAr: 'محكمة النقض', nameEn: 'Court of Cassation', type: CourtType.CASSATION, governorateId: gov['Cairo'].id },
      { nameAr: 'المحكمة الإدارية العليا (مجلس الدولة)', nameEn: 'Supreme Administrative Court (State Council)', type: CourtType.CASSATION, governorateId: gov['Cairo'].id },
    ],
  });

  // ─── 2. High Courts of Appeal & Economic Courts (محاكم الاستئناف العالي والمحاكم الاقتصادية) ───
  const appealData = [
    // High Courts of Appeal (8 Judicial Circuits)
    { nameAr: 'محكمة استئناف القاهرة', nameEn: 'Cairo Court of Appeal', govKey: 'Cairo' },
    { nameAr: 'محكمة استئناف الإسكندرية', nameEn: 'Alexandria Court of Appeal', govKey: 'Alexandria' },
    { nameAr: 'محكمة استئناف طنطا', nameEn: 'Tanta Court of Appeal', govKey: 'Gharbia' },
    { nameAr: 'محكمة استئناف المنصورة', nameEn: 'Mansoura Court of Appeal', govKey: 'Dakahlia' },
    { nameAr: 'محكمة استئناف الإسماعيلية', nameEn: 'Ismailia Court of Appeal', govKey: 'Ismailia' },
    { nameAr: 'محكمة استئناف بني سويف', nameEn: 'Beni Suef Court of Appeal', govKey: 'Beni Suef' },
    { nameAr: 'محكمة استئناف أسيوط', nameEn: 'Asyut Court of Appeal', govKey: 'Asyut' },
    { nameAr: 'محكمة استئناف قنا', nameEn: 'Qena Court of Appeal', govKey: 'Qena' },
    // Economic Courts (8 Circuits)
    { nameAr: 'المحكمة الاقتصادية بالقاهرة', nameEn: 'Cairo Economic Court', govKey: 'Cairo' },
    { nameAr: 'المحكمة الاقتصادية بالإسكندرية', nameEn: 'Alexandria Economic Court', govKey: 'Alexandria' },
    { nameAr: 'المحكمة الاقتصادية بطنطا', nameEn: 'Tanta Economic Court', govKey: 'Gharbia' },
    { nameAr: 'المحكمة الاقتصادية بالمنصورة', nameEn: 'Mansoura Economic Court', govKey: 'Dakahlia' },
    { nameAr: 'المحكمة الاقتصادية بالإسماعيلية', nameEn: 'Ismailia Economic Court', govKey: 'Ismailia' },
    { nameAr: 'المحكمة الاقتصادية ببني سويف', nameEn: 'Beni Suef Economic Court', govKey: 'Beni Suef' },
    { nameAr: 'المحكمة الاقتصادية بأسيوط', nameEn: 'Asyut Economic Court', govKey: 'Asyut' },
    { nameAr: 'المحكمة الاقتصادية بقنا', nameEn: 'Qena Economic Court', govKey: 'Qena' },
  ];
  await Promise.all(
    appealData.map(a =>
      prisma.court.create({
        data: { nameAr: a.nameAr, nameEn: a.nameEn, type: CourtType.APPEAL, governorateId: gov[a.govKey].id },
      })
    )
  );

  // ─── 3. Primary Courts & State Council Courts (المحاكم الابتدائية ومحاكم القضاء الإداري) ───
  const primaryData = [
    // Cairo
    { nameAr: 'محكمة شمال القاهرة الابتدائية', nameEn: 'North Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة جنوب القاهرة الابتدائية', nameEn: 'South Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة القاهرة الجديدة الابتدائية', nameEn: 'New Cairo Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة حلوان الابتدائية', nameEn: 'Helwan Primary Court', govKey: 'Cairo' },
    { nameAr: 'محكمة القضاء الإداري بالقاهرة (مجلس الدولة)', nameEn: 'Cairo Administrative Court (State Council)', govKey: 'Cairo' },
    // Giza
    { nameAr: 'محكمة شمال الجيزة الابتدائية', nameEn: 'North Giza Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة جنوب الجيزة الابتدائية', nameEn: 'South Giza Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة 6 أكتوبر الابتدائية', nameEn: '6th of October Primary Court', govKey: 'Giza' },
    { nameAr: 'محكمة القضاء الإداري بالجيزة (مجلس الدولة)', nameEn: 'Giza Administrative Court (State Council)', govKey: 'Giza' },
    // Alexandria
    { nameAr: 'محكمة شرق الإسكندرية الابتدائية', nameEn: 'East Alexandria Primary Court', govKey: 'Alexandria' },
    { nameAr: 'محكمة غرب الإسكندرية الابتدائية', nameEn: 'West Alexandria Primary Court', govKey: 'Alexandria' },
    { nameAr: 'محكمة القضاء الإداري بالإسكندرية (مجلس الدولة)', nameEn: 'Alexandria Administrative Court (State Council)', govKey: 'Alexandria' },
    // Qalyubia
    { nameAr: 'محكمة جنوب القليوبية الابتدائية (بنها)', nameEn: 'South Qalyubia (Banha) Primary Court', govKey: 'Qalyubia' },
    { nameAr: 'محكمة شمال القليوبية الابتدائية (شبين القناطر)', nameEn: 'North Qalyubia (Shibin al-Qanater) Primary Court', govKey: 'Qalyubia' },
    { nameAr: 'محكمة القضاء الإداري بالقليوبية (مجلس الدولة)', nameEn: 'Qalyubia Administrative Court (State Council)', govKey: 'Qalyubia' },
    // Sharqia
    { nameAr: 'محكمة جنوب الشرقية الابتدائية (الزقازيق)', nameEn: 'South Sharqia (Zagazig) Primary Court', govKey: 'Sharqia' },
    { nameAr: 'محكمة شمال الشرقية الابتدائية (ههيا)', nameEn: 'North Sharqia (Hihya) Primary Court', govKey: 'Sharqia' },
    { nameAr: 'محكمة القضاء الإداري بالشرقية (مجلس الدولة)', nameEn: 'Sharqia Administrative Court (State Council)', govKey: 'Sharqia' },
    // Monufia
    { nameAr: 'محكمة شبين الكوم الابتدائية', nameEn: 'Shibin el-Kom Primary Court', govKey: 'Monufia' },
    { nameAr: 'محكمة القضاء الإداري بالمنوفية (مجلس الدولة)', nameEn: 'Monufia Administrative Court (State Council)', govKey: 'Monufia' },
    // Gharbia
    { nameAr: 'محكمة غرب طنطا الابتدائية', nameEn: 'West Tanta Primary Court', govKey: 'Gharbia' },
    { nameAr: 'محكمة شرق طنطا الابتدائية (المحلة الكبرى)', nameEn: 'East Tanta (Mahalla) Primary Court', govKey: 'Gharbia' },
    { nameAr: 'محكمة القضاء الإداري بالغربية (مجلس الدولة)', nameEn: 'Gharbia Administrative Court (State Council)', govKey: 'Gharbia' },
    // Kafr el-Sheikh
    { nameAr: 'محكمة كفر الشيخ الابتدائية', nameEn: 'Kafr el-Sheikh Primary Court', govKey: 'Kafr el-Sheikh' },
    { nameAr: 'محكمة القضاء الإداري بكفر الشيخ (مجلس الدولة)', nameEn: 'Kafr el-Sheikh Administrative Court (State Council)', govKey: 'Kafr el-Sheikh' },
    // Dakahlia
    { nameAr: 'محكمة جنوب المنصورة الابتدائية', nameEn: 'South Mansoura Primary Court', govKey: 'Dakahlia' },
    { nameAr: 'محكمة شمال المنصورة الابتدائية (دكرنس)', nameEn: 'North Mansoura (Dekernes) Primary Court', govKey: 'Dakahlia' },
    { nameAr: 'محكمة القضاء الإداري بالدقهلية (مجلس الدولة)', nameEn: 'Dakahlia Administrative Court (State Council)', govKey: 'Dakahlia' },
    // Damietta
    { nameAr: 'محكمة دمياط الابتدائية', nameEn: 'Damietta Primary Court', govKey: 'Damietta' },
    { nameAr: 'محكمة القضاء الإداري بدمياط (مجلس الدولة)', nameEn: 'Damietta Administrative Court (State Council)', govKey: 'Damietta' },
    // Port Said
    { nameAr: 'محكمة بورسعيد الابتدائية', nameEn: 'Port Said Primary Court', govKey: 'Port Said' },
    { nameAr: 'محكمة القضاء الإداري ببورسعيد (مجلس الدولة)', nameEn: 'Port Said Administrative Court (State Council)', govKey: 'Port Said' },
    // Ismailia
    { nameAr: 'محكمة الإسماعيلية الابتدائية', nameEn: 'Ismailia Primary Court', govKey: 'Ismailia' },
    { nameAr: 'محكمة القضاء الإداري بالإسماعيلية (مجلس الدولة)', nameEn: 'Ismailia Administrative Court (State Council)', govKey: 'Ismailia' },
    // Suez
    { nameAr: 'محكمة السويس الابتدائية', nameEn: 'Suez Primary Court', govKey: 'Suez' },
    { nameAr: 'محكمة القضاء الإداري بالسويس (مجلس الدولة)', nameEn: 'Suez Administrative Court (State Council)', govKey: 'Suez' },
    // Beheira
    { nameAr: 'محكمة شمال دمنهور الابتدائية', nameEn: 'North Damanhur Primary Court', govKey: 'Beheira' },
    { nameAr: 'محكمة جنوب دمنهور الابتدائية (إيتاي البارود)', nameEn: 'South Damanhur (Itay El Baroud) Primary Court', govKey: 'Beheira' },
    { nameAr: 'محكمة القضاء الإداري بالبحيرة (مجلس الدولة)', nameEn: 'Beheira Administrative Court (State Council)', govKey: 'Beheira' },
    // Faiyum
    { nameAr: 'محكمة الفيوم الابتدائية', nameEn: 'Faiyum Primary Court', govKey: 'Faiyum' },
    { nameAr: 'محكمة القضاء الإداري بالفيوم (مجلس الدولة)', nameEn: 'Faiyum Administrative Court (State Council)', govKey: 'Faiyum' },
    // Beni Suef
    { nameAr: 'محكمة بني سويف الابتدائية', nameEn: 'Beni Suef Primary Court', govKey: 'Beni Suef' },
    { nameAr: 'محكمة القضاء الإداري ببني سويف (مجلس الدولة)', nameEn: 'Beni Suef Administrative Court (State Council)', govKey: 'Beni Suef' },
    // Minya
    { nameAr: 'محكمة المنيا الابتدائية', nameEn: 'Minya Primary Court', govKey: 'Minya' },
    { nameAr: 'محكمة القضاء الإداري بالمنيا (مجلس الدولة)', nameEn: 'Minya Administrative Court (State Council)', govKey: 'Minya' },
    // Asyut
    { nameAr: 'محكمة شمال أسيوط الابتدائية', nameEn: 'North Asyut Primary Court', govKey: 'Asyut' },
    { nameAr: 'محكمة جنوب أسيوط الابتدائية', nameEn: 'South Asyut Primary Court', govKey: 'Asyut' },
    { nameAr: 'محكمة منفلوط الابتدائية', nameEn: 'Manfalut Primary Court', govKey: 'Asyut' },
    { nameAr: 'محكمة القضاء الإداري بأسيوط (مجلس الدولة)', nameEn: 'Asyut Administrative Court (State Council)', govKey: 'Asyut' },
    // Sohag
    { nameAr: 'محكمة سوهاج الابتدائية', nameEn: 'Sohag Primary Court', govKey: 'Sohag' },
    { nameAr: 'محكمة طهطا الابتدائية', nameEn: 'Tahta Primary Court', govKey: 'Sohag' },
    { nameAr: 'محكمة القضاء الإداري بسوهاج (مجلس الدولة)', nameEn: 'Sohag Administrative Court (State Council)', govKey: 'Sohag' },
    // Qena
    { nameAr: 'محكمة قنا الابتدائية', nameEn: 'Qena Primary Court', govKey: 'Qena' },
    { nameAr: 'محكمة القضاء الإداري بقنا (مجلس الدولة)', nameEn: 'Qena Administrative Court (State Council)', govKey: 'Qena' },
    // Luxor
    { nameAr: 'محكمة الأقصر الابتدائية', nameEn: 'Luxor Primary Court', govKey: 'Luxor' },
    { nameAr: 'محكمة القضاء الإداري بالأقصر (مجلس الدولة)', nameEn: 'Luxor Administrative Court (State Council)', govKey: 'Luxor' },
    // Aswan
    { nameAr: 'محكمة أسوان الابتدائية', nameEn: 'Aswan Primary Court', govKey: 'Aswan' },
    { nameAr: 'محكمة القضاء الإداري بأسوان (مجلس الدولة)', nameEn: 'Aswan Administrative Court (State Council)', govKey: 'Aswan' },
    // Red Sea
    { nameAr: 'محكمة البحر الأحمر الابتدائية (الغردقة)', nameEn: 'Red Sea (Hurghada) Primary Court', govKey: 'Red Sea' },
    { nameAr: 'محكمة القضاء الإداري بالبحر الأحمر (مجلس الدولة)', nameEn: 'Red Sea Administrative Court (State Council)', govKey: 'Red Sea' },
    // New Valley
    { nameAr: 'محكمة الوادي الجديد الابتدائية', nameEn: 'New Valley Primary Court', govKey: 'New Valley' },
    { nameAr: 'محكمة القضاء الإداري بالوادي الجديد (مجلس الدولة)', nameEn: 'New Valley Administrative Court (State Council)', govKey: 'New Valley' },
    // Matrouh
    { nameAr: 'محكمة مرسى مطروح الابتدائية', nameEn: 'Marsa Matrouh Primary Court', govKey: 'Matrouh' },
    { nameAr: 'محكمة القضاء الإداري بمطروح (مجلس الدولة)', nameEn: 'Matrouh Administrative Court (State Council)', govKey: 'Matrouh' },
    // North Sinai
    { nameAr: 'محكمة شمال سيناء الابتدائية (العريش)', nameEn: 'North Sinai (Arish) Primary Court', govKey: 'North Sinai' },
    // South Sinai
    { nameAr: 'محكمة جنوب سيناء الابتدائية (الطور)', nameEn: 'South Sinai (El Tor) Primary Court', govKey: 'South Sinai' },
  ];
  const primaries = await Promise.all(
    primaryData.map(p =>
      prisma.court.create({
        data: { nameAr: p.nameAr, nameEn: p.nameEn, type: CourtType.PRIMARY, governorateId: gov[p.govKey].id },
      })
    )
  );
  const primaryMap = Object.fromEntries(primaries.map(p => [p.nameEn, p]));

  // ─── 4. Partial & Family Courts Across All 27 Governorates (المحاكم الجزئية ومحاكم الأسرة) ───
  const partialData = [
    // ── Cairo (القاهرة) ──
    { nameAr: 'محكمة مدينة نصر الجزئية', nameEn: 'Madinat Nasr Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة القاهرة الجديدة الجزئية (التجمع)', nameEn: 'New Cairo Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة الشروق وبدر الجزئية', nameEn: 'El Shorouk & Badr Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة مصر الجديدة الجزئية', nameEn: 'Heliopolis Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة النزهة الجزئية', nameEn: 'El Nozha Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة عين شمس الجزئية', nameEn: 'Ain Shams Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة السلام والمرج الجزئية', nameEn: 'El Salam & El Marg Partial Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة الزيتون الجزئية', nameEn: 'Zaytoun Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة المطرية الجزئية', nameEn: 'Matariya Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة حدائق القبة الجزئية', nameEn: 'Hadayek El Kobba Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الأميرية الجزئية', nameEn: 'Amiriya Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة شبرا الجزئية', nameEn: 'Shubra Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة روض الفرج الجزئية', nameEn: 'Rod El Farag Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الساحل الجزئية', nameEn: 'El Sahel Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الشرابية والزاوية الحمراء الجزئية', nameEn: 'Sharabiya & Zawya El Hamra Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الأزبكية والظاهر الجزئية', nameEn: 'Azbakeya & El Daher Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الوايلي والعباسية الجزئية', nameEn: 'El Wayli & Abbasiya Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة باب الشعرية والموسكي الجزئية', nameEn: 'Bab El Shaariya & El Mosky Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة بولاق أبو العلا الجزئية', nameEn: 'Bulaq Abu El Ela Partial Court', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة عابدين الجزئية', nameEn: 'Abdin Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة قصر النيل الجزئية', nameEn: 'Qasr El Nil Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة السيدة زينب الجزئية', nameEn: 'Sayeda Zeinab Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة مصر القديمة الجزئية', nameEn: 'Old Cairo Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة الخليفة والمقطم الجزئية', nameEn: 'El Khalifa & Mokattam Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة الدرب الأحمر والجمالية الجزئية', nameEn: 'El Darb El Ahmar & Gamaliya Partial Court', govKey: 'Cairo', parentEn: 'South Cairo Primary Court' },
    { nameAr: 'محكمة المعادي والبساتين الجزئية', nameEn: 'Maadi & Basatin Partial Court', govKey: 'Cairo', parentEn: 'Helwan Primary Court' },
    { nameAr: 'محكمة حلوان والتبين الجزئية', nameEn: 'Helwan & El Tebbin Partial Court', govKey: 'Cairo', parentEn: 'Helwan Primary Court' },
    { nameAr: 'محكمة 15 مايو والمعصرة الجزئية', nameEn: '15th of May & El Maasara Partial Court', govKey: 'Cairo', parentEn: 'Helwan Primary Court' },
    { nameAr: 'محكمة الأسرة بزنانيري (القاهرة)', nameEn: 'Zananiri Family Court (Cairo)', govKey: 'Cairo', parentEn: 'North Cairo Primary Court' },
    { nameAr: 'محكمة الأسرة بالقاهرة الجديدة', nameEn: 'New Cairo Family Court', govKey: 'Cairo', parentEn: 'New Cairo Primary Court' },
    { nameAr: 'محكمة الأسرة بالمعادي', nameEn: 'Maadi Family Court', govKey: 'Cairo', parentEn: 'Helwan Primary Court' },

    // ── Giza (الجيزة) ──
    { nameAr: 'محكمة الجيزة الجزئية', nameEn: 'Giza Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة العمرانية والطالبية الجزئية', nameEn: 'Umraniya & Talbiya Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة الهرم الجزئية', nameEn: 'El Haram Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة الحوامدية وأبو النمرس الجزئية', nameEn: 'Hawamdiya & Abu El Nomros Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة البدرشين الجزئية', nameEn: 'Badrashein Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة العياط الجزئية', nameEn: 'El Ayyat Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة الصف وأطفيح الجزئية', nameEn: 'El Saff & Atfih Partial Court', govKey: 'Giza', parentEn: 'South Giza Primary Court' },
    { nameAr: 'محكمة الدقي والعجوزة الجزئية', nameEn: 'Dokki & Agouza Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة بولاق الدكرور الجزئية', nameEn: 'Bulaq Dakrur Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة إمبابة والمنيرة الجزئية', nameEn: 'Imbaba & El Munira Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة الوراق وأوسيم الجزئية', nameEn: 'El Warraq & Ausim Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة العجوزة ومركز إمبابة (كرداسة) الجزئية', nameEn: 'Kerdasa & Imbaba Center Partial Court', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة 6 أكتوبر الجزئية', nameEn: '6th of October Partial Court', govKey: 'Giza', parentEn: '6th of October Primary Court' },
    { nameAr: 'محكمة الشيخ زايد الجزئية', nameEn: 'Sheikh Zayed Partial Court', govKey: 'Giza', parentEn: '6th of October Primary Court' },
    { nameAr: 'محكمة الواحات البحرية الجزئية', nameEn: 'Bahariya Oasis Partial Court', govKey: 'Giza', parentEn: '6th of October Primary Court' },
    { nameAr: 'محكمة الأسرة بالكيت كات (الجيزة)', nameEn: 'Kit Kat Family Court (Giza)', govKey: 'Giza', parentEn: 'North Giza Primary Court' },
    { nameAr: 'محكمة الأسرة بـ 6 أكتوبر', nameEn: '6th of October Family Court', govKey: 'Giza', parentEn: '6th of October Primary Court' },

    // ── Alexandria (الإسكندرية) ──
    { nameAr: 'محكمة المنتزه الجزئية', nameEn: 'Montaza Partial Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },
    { nameAr: 'محكمة الرمل الجزئية', nameEn: 'El Raml Partial Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },
    { nameAr: 'محكمة سيدي جابر الجزئية', nameEn: 'Sidi Gaber Partial Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },
    { nameAr: 'محكمة باب شرقي الجزئية', nameEn: 'Bab Sharqi Partial Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },
    { nameAr: 'محكمة محرم بك الجزئية', nameEn: 'Moharam Bek Partial Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },
    { nameAr: 'محكمة العطارين والمنشية الجزئية', nameEn: 'Attarin & Mansheya Partial Court', govKey: 'Alexandria', parentEn: 'West Alexandria Primary Court' },
    { nameAr: 'محكمة الجمرك واللبان الجزئية', nameEn: 'Gomrok & Labban Partial Court', govKey: 'Alexandria', parentEn: 'West Alexandria Primary Court' },
    { nameAr: 'محكمة كرموز ومينا البصل الجزئية', nameEn: 'Karmouz & Mina El Basal Partial Court', govKey: 'Alexandria', parentEn: 'West Alexandria Primary Court' },
    { nameAr: 'محكمة الدخيلة والعامرية الجزئية', nameEn: 'Dekheila & Amreya Partial Court', govKey: 'Alexandria', parentEn: 'West Alexandria Primary Court' },
    { nameAr: 'محكمة برج العرب الجزئية', nameEn: 'Borg El Arab Partial Court', govKey: 'Alexandria', parentEn: 'West Alexandria Primary Court' },
    { nameAr: 'محكمة الأسرة بالإسكندرية', nameEn: 'Alexandria Family Court', govKey: 'Alexandria', parentEn: 'East Alexandria Primary Court' },

    // ── Qalyubia (القليوبية) ──
    { nameAr: 'محكمة بندر ومركز بنها الجزئية', nameEn: 'Banha Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة طوخ وقها الجزئية', nameEn: 'Toukh & Qaha Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة كفر شكر الجزئية', nameEn: 'Kafr Shukr Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة قليوب الجزئية', nameEn: 'Qalyub Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة القناطر الخيرية الجزئية', nameEn: 'El Qanater El Khayreya Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة شبرا الخيمة الجزئية', nameEn: 'Shubra El Kheima Partial Court', govKey: 'Qalyubia', parentEn: 'South Qalyubia (Banha) Primary Court' },
    { nameAr: 'محكمة شبين القناطر الجزئية', nameEn: 'Shibin al-Qanater Partial Court', govKey: 'Qalyubia', parentEn: 'North Qalyubia (Shibin al-Qanater) Primary Court' },
    { nameAr: 'محكمة الخانكة والعبور الجزئية', nameEn: 'Khanka & Obour Partial Court', govKey: 'Qalyubia', parentEn: 'North Qalyubia (Shibin al-Qanater) Primary Court' },
    { nameAr: 'محكمة الخصوص الجزئية', nameEn: 'El Khanka & Khosous Partial Court', govKey: 'Qalyubia', parentEn: 'North Qalyubia (Shibin al-Qanater) Primary Court' },

    // ── Sharqia (الشرقية) ──
    { nameAr: 'محكمة بندر ومركز الزقازيق الجزئية', nameEn: 'Zagazig Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة بلبيس الجزئية', nameEn: 'Belbeis Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة منيا القمح الجزئية', nameEn: 'Minya El Qamh Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة أبو حماد والقرين الجزئية', nameEn: 'Abu Hammad Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة العاشر من رمضان الجزئية', nameEn: '10th of Ramadan Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة مشتول السوق الجزئية', nameEn: 'Mashtoul El Souk Partial Court', govKey: 'Sharqia', parentEn: 'South Sharqia (Zagazig) Primary Court' },
    { nameAr: 'محكمة ههيا والإبراهيمية الجزئية', nameEn: 'Hihya & Ibrahimiya Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },
    { nameAr: 'محكمة أبو كبير الجزئية', nameEn: 'Abu Kebir Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },
    { nameAr: 'محكمة فاقوس الجزئية', nameEn: 'Faqous Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },
    { nameAr: 'محكمة الحسينية والصالحية الجديدة الجزئية', nameEn: 'Husseiniya & New Salhia Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },
    { nameAr: 'محكمة كفر صقر وأولاد صقر الجزئية', nameEn: 'Kafr Saqr & Awlad Saqr Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },
    { nameAr: 'محكمة ديرب نجم الجزئية', nameEn: 'Diyarb Negm Partial Court', govKey: 'Sharqia', parentEn: 'North Sharqia (Hihya) Primary Court' },

    // ── Monufia (المنوفية) ──
    { nameAr: 'محكمة بندر ومركز شبين الكوم الجزئية', nameEn: 'Shibin el-Kom Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة منوف وسرس الليان الجزئية', nameEn: 'Menouf Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة أشمون الجزئية', nameEn: 'Ashmoun Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة الباجور الجزئية', nameEn: 'El Bagour Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة قويسنا الجزئية', nameEn: 'Quesna Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة بركة السبع الجزئية', nameEn: 'Berket El Sabaa Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة تلا الجزئية', nameEn: 'Tala Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة الشهداء الجزئية', nameEn: 'El Shohada Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },
    { nameAr: 'محكمة السادات الجزئية', nameEn: 'Sadat Partial Court', govKey: 'Monufia', parentEn: 'Shibin el-Kom Primary Court' },

    // ── Gharbia (الغربية) ──
    { nameAr: 'محكمة بندر ومركز طنطا الجزئية', nameEn: 'Tanta Partial Court', govKey: 'Gharbia', parentEn: 'West Tanta Primary Court' },
    { nameAr: 'محكمة كفر الزيات الجزئية', nameEn: 'Kafr El Zayat Partial Court', govKey: 'Gharbia', parentEn: 'West Tanta Primary Court' },
    { nameAr: 'محكمة بسيون الجزئية', nameEn: 'Basyoun Partial Court', govKey: 'Gharbia', parentEn: 'West Tanta Primary Court' },
    { nameAr: 'محكمة قطور الجزئية', nameEn: 'Qutour Partial Court', govKey: 'Gharbia', parentEn: 'West Tanta Primary Court' },
    { nameAr: 'محكمة المحلة الكبرى الجزئية', nameEn: 'Mahalla al-Kubra Partial Court', govKey: 'Gharbia', parentEn: 'East Tanta (Mahalla) Primary Court' },
    { nameAr: 'محكمة سمنود الجزئية', nameEn: 'Samannud Partial Court', govKey: 'Gharbia', parentEn: 'East Tanta (Mahalla) Primary Court' },
    { nameAr: 'محكمة زفتى الجزئية', nameEn: 'Zefta Partial Court', govKey: 'Gharbia', parentEn: 'East Tanta (Mahalla) Primary Court' },
    { nameAr: 'محكمة السنطة الجزئية', nameEn: 'El Santa Partial Court', govKey: 'Gharbia', parentEn: 'East Tanta (Mahalla) Primary Court' },

    // ── Kafr el-Sheikh (كفر الشيخ) ──
    { nameAr: 'محكمة بندر ومركز كفر الشيخ الجزئية', nameEn: 'Kafr el-Sheikh Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة دسوق الجزئية', nameEn: 'Desouk Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة فوه ومطوبس الجزئية', nameEn: 'Fuwwah & Metoubes Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة بيلا والحامول الجزئية', nameEn: 'Biyala & El Hamoul Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة سيدي سالم الجزئية', nameEn: 'Sidi Salem Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة قلين الجزئية', nameEn: 'Qallin Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة البرلس (بلطيم) الجزئية', nameEn: 'Baltim (Burullus) Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },
    { nameAr: 'محكمة الرياض الجزئية', nameEn: 'El Reyad Partial Court', govKey: 'Kafr el-Sheikh', parentEn: 'Kafr el-Sheikh Primary Court' },

    // ── Dakahlia (الدقهلية) ──
    { nameAr: 'محكمة قسم ومركز المنصورة الجزئية', nameEn: 'Mansoura Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة طلخا ونبروه الجزئية', nameEn: 'Talkha & Nabaroh Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة بلقاس وجمصة الجزئية', nameEn: 'Bilqas Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة أجا الجزئية', nameEn: 'Aga Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة السنبلاوين وتمي الأمديد الجزئية', nameEn: 'Sinbillawin Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة ميت غمر الجزئية', nameEn: 'Mit Ghamr Partial Court', govKey: 'Dakahlia', parentEn: 'South Mansoura Primary Court' },
    { nameAr: 'محكمة دكرنس وبني عبيد الجزئية', nameEn: 'Dekernes Partial Court', govKey: 'Dakahlia', parentEn: 'North Mansoura (Dekernes) Primary Court' },
    { nameAr: 'محكمة المنزلة والمطرية الجزئية', nameEn: 'Manzala & Matariya Partial Court', govKey: 'Dakahlia', parentEn: 'North Mansoura (Dekernes) Primary Court' },
    { nameAr: 'محكمة منية النصر وميت سلسيل الجزئية', nameEn: 'Minyat El Nasr Partial Court', govKey: 'Dakahlia', parentEn: 'North Mansoura (Dekernes) Primary Court' },
    { nameAr: 'محكمة شربين الجزئية', nameEn: 'Sherbin Partial Court', govKey: 'Dakahlia', parentEn: 'North Mansoura (Dekernes) Primary Court' },

    // ── Damietta (دمياط) ──
    { nameAr: 'محكمة بندر ومركز دمياط الجزئية', nameEn: 'Damietta Partial Court', govKey: 'Damietta', parentEn: 'Damietta Primary Court' },
    { nameAr: 'محكمة فارسكور والزرقا الجزئية', nameEn: 'Faraskour & El Zarqa Partial Court', govKey: 'Damietta', parentEn: 'Damietta Primary Court' },
    { nameAr: 'محكمة كفر سعد ودمياط الجديدة الجزئية', nameEn: 'Kafr Saad & New Damietta Partial Court', govKey: 'Damietta', parentEn: 'Damietta Primary Court' },
    { nameAr: 'محكمة رأس البر وعزبة البرج الجزئية', nameEn: 'Ras El Bar Partial Court', govKey: 'Damietta', parentEn: 'Damietta Primary Court' },

    // ── Port Said (بورسعيد) ──
    { nameAr: 'محكمة الشرق والعرب الجزئية (بورسعيد)', nameEn: 'El Sharq & El Arab Partial Court (Port Said)', govKey: 'Port Said', parentEn: 'Port Said Primary Court' },
    { nameAr: 'محكمة المناخ والزهور والضواحي الجزئية', nameEn: 'El Manakh & El Zohour Partial Court', govKey: 'Port Said', parentEn: 'Port Said Primary Court' },
    { nameAr: 'محكمة بورفؤاد الجزئية', nameEn: 'Port Fouad Partial Court', govKey: 'Port Said', parentEn: 'Port Said Primary Court' },

    // ── Ismailia (الإسماعيلية) ──
    { nameAr: 'محكمة بندر ومركز الإسماعيلية الجزئية', nameEn: 'Ismailia Partial Court', govKey: 'Ismailia', parentEn: 'Ismailia Primary Court' },
    { nameAr: 'محكمة التل الكبير والقصاصين الجزئية', nameEn: 'Tell El Kebir Partial Court', govKey: 'Ismailia', parentEn: 'Ismailia Primary Court' },
    { nameAr: 'محكمة فايد الجزئية', nameEn: 'Fayed Partial Court', govKey: 'Ismailia', parentEn: 'Ismailia Primary Court' },
    { nameAr: 'محكمة القنطرة شرق وغرب الجزئية', nameEn: 'Qantara East & West Partial Court', govKey: 'Ismailia', parentEn: 'Ismailia Primary Court' },

    // ── Suez (السويس) ──
    { nameAr: 'محكمة السويس والأربعين الجزئية', nameEn: 'Suez & El Arbaeen Partial Court', govKey: 'Suez', parentEn: 'Suez Primary Court' },
    { nameAr: 'محكمة فيصل وعتاقة والجناين الجزئية', nameEn: 'Faisal & Ataqa Partial Court', govKey: 'Suez', parentEn: 'Suez Primary Court' },

    // ── Beheira (البحيرة) ──
    { nameAr: 'محكمة بندر ومركز دمنهور الجزئية', nameEn: 'Damanhur Partial Court', govKey: 'Beheira', parentEn: 'North Damanhur Primary Court' },
    { nameAr: 'محكمة كفر الدوار الجزئية', nameEn: 'Kafr El Dawwar Partial Court', govKey: 'Beheira', parentEn: 'North Damanhur Primary Court' },
    { nameAr: 'محكمة رشيد وإدكو الجزئية', nameEn: 'Rosetta & Edku Partial Court', govKey: 'Beheira', parentEn: 'North Damanhur Primary Court' },
    { nameAr: 'محكمة أبو حمص والمحمودية الجزئية', nameEn: 'Abu Hummus & Mahmoudiya Partial Court', govKey: 'Beheira', parentEn: 'North Damanhur Primary Court' },
    { nameAr: 'محكمة حوش عيسى وأبو المطامير الجزئية', nameEn: 'Hosh Essa & Abu El Matamir Partial Court', govKey: 'Beheira', parentEn: 'North Damanhur Primary Court' },
    { nameAr: 'محكمة إيتاي البارود وشبراخيت الجزئية', nameEn: 'Itay El Baroud & Shubrakhit Partial Court', govKey: 'Beheira', parentEn: 'South Damanhur (Itay El Baroud) Primary Court' },
    { nameAr: 'محكمة كوم حمادة وبدر الجزئية', nameEn: 'Kom Hamada & Badr Partial Court', govKey: 'Beheira', parentEn: 'South Damanhur (Itay El Baroud) Primary Court' },
    { nameAr: 'محكمة الدلنجات والرحمانية الجزئية', nameEn: 'Delengat & Rahmaniya Partial Court', govKey: 'Beheira', parentEn: 'South Damanhur (Itay El Baroud) Primary Court' },
    { nameAr: 'محكمة وادي النطرون والنوبارية الجزئية', nameEn: 'Wadi El Natrun & Nubariya Partial Court', govKey: 'Beheira', parentEn: 'South Damanhur (Itay El Baroud) Primary Court' },

    // ── Faiyum (الفيوم) ──
    { nameAr: 'محكمة بندر ومركز الفيوم الجزئية', nameEn: 'Faiyum Partial Court', govKey: 'Faiyum', parentEn: 'Faiyum Primary Court' },
    { nameAr: 'محكمة سنورس الجزئية', nameEn: 'Sinnuris Partial Court', govKey: 'Faiyum', parentEn: 'Faiyum Primary Court' },
    { nameAr: 'محكمة طامية الجزئية', nameEn: 'Tamiya Partial Court', govKey: 'Faiyum', parentEn: 'Faiyum Primary Court' },
    { nameAr: 'محكمة إطسا الجزئية', nameEn: 'Itsa Partial Court', govKey: 'Faiyum', parentEn: 'Faiyum Primary Court' },
    { nameAr: 'محكمة أبشواي ويوسف الصديق الجزئية', nameEn: 'Ibsheway & Youssef El Seddik Partial Court', govKey: 'Faiyum', parentEn: 'Faiyum Primary Court' },

    // ── Beni Suef (بني سويف) ──
    { nameAr: 'محكمة بندر ومركز بني سويف الجزئية', nameEn: 'Beni Suef Center Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الواسطى الجزئية', nameEn: 'El Wasta Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة ناصر الجزئية (بوش)', nameEn: 'Nasser (Boush) Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة إهناسيا الجزئية', nameEn: 'Ihnasia Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة ببا الجزئية', nameEn: 'Biba Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الفشن الجزئية', nameEn: 'El Fashn Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة سمسطا الجزئية', nameEn: 'Sumusta Partial Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },
    { nameAr: 'محكمة الأسرة ببني سويف', nameEn: 'Beni Suef Family Court', govKey: 'Beni Suef', parentEn: 'Beni Suef Primary Court' },

    // ── Minya (المنيا) ──
    { nameAr: 'محكمة بندر ومركز المنيا الجزئية', nameEn: 'Minya City and Center Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة العدوة الجزئية', nameEn: 'El Adwa Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة مغاغة الجزئية', nameEn: 'Maghagha Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة بني مزار الجزئية', nameEn: 'Beni Mazar Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة مطاي الجزئية', nameEn: 'Matay Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة سمالوط الجزئية', nameEn: 'Samalut Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة أبو قرقاص الجزئية', nameEn: 'Abu Qurqas Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة ملوي الجزئية', nameEn: 'Mallawi Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة دير مواس الجزئية', nameEn: 'Deir Mawas Partial Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },
    { nameAr: 'محكمة الأسرة بالمنيا', nameEn: 'Minya Family Court', govKey: 'Minya', parentEn: 'Minya Primary Court' },

    // ── Asyut (أسيوط) ──
    { nameAr: 'محكمة بندر ومركز أسيوط الجزئية', nameEn: 'Asyut Partial Court', govKey: 'Asyut', parentEn: 'North Asyut Primary Court' },
    { nameAr: 'محكمة الفتح وأسيوط الجديدة الجزئية', nameEn: 'El Fateh & New Asyut Partial Court', govKey: 'Asyut', parentEn: 'North Asyut Primary Court' },
    { nameAr: 'محكمة أبنوب الجزئية', nameEn: 'Abnub Partial Court', govKey: 'Asyut', parentEn: 'North Asyut Primary Court' },
    { nameAr: 'محكمة منفلوط الجزئية', nameEn: 'Manfalut Partial Court', govKey: 'Asyut', parentEn: 'Manfalut Primary Court' },
    { nameAr: 'محكمة القوصية الجزئية', nameEn: 'El Qusiya Partial Court', govKey: 'Asyut', parentEn: 'Manfalut Primary Court' },
    { nameAr: 'محكمة ديروط الجزئية', nameEn: 'Dayrut Partial Court', govKey: 'Asyut', parentEn: 'Manfalut Primary Court' },
    { nameAr: 'محكمة أبو تيج الجزئية', nameEn: 'Abu Tig Partial Court', govKey: 'Asyut', parentEn: 'South Asyut Primary Court' },
    { nameAr: 'محكمة صدفا والغنايم الجزئية', nameEn: 'Sedfa & El Ghanayem Partial Court', govKey: 'Asyut', parentEn: 'South Asyut Primary Court' },
    { nameAr: 'محكمة ساحل سليم والبداري الجزئية', nameEn: 'Sahel Selim & El Badari Partial Court', govKey: 'Asyut', parentEn: 'South Asyut Primary Court' },

    // ── Sohag (سوهاج) ──
    { nameAr: 'محكمة بندر ومركز سوهاج الجزئية', nameEn: 'Sohag Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة أخميم وساقلتة الجزئية', nameEn: 'Akhmim & Saqultah Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة المنشأة الجزئية', nameEn: 'El Monshah Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة جرجا والعسيرات الجزئية', nameEn: 'Girga Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة البلينا الجزئية', nameEn: 'El Balyana Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة دار السلام الجزئية', nameEn: 'Dar El Salam Partial Court', govKey: 'Sohag', parentEn: 'Sohag Primary Court' },
    { nameAr: 'محكمة طهطا وجهينة الجزئية', nameEn: 'Tahta & Juhaynah Partial Court', govKey: 'Sohag', parentEn: 'Tahta Primary Court' },
    { nameAr: 'محكمة طما الجزئية', nameEn: 'Tima Partial Court', govKey: 'Sohag', parentEn: 'Tahta Primary Court' },
    { nameAr: 'محكمة المراغة الجزئية', nameEn: 'El Maragha Partial Court', govKey: 'Sohag', parentEn: 'Tahta Primary Court' },

    // ── Qena (قنا) ──
    { nameAr: 'محكمة بندر ومركز قنا الجزئية', nameEn: 'Qena City and Center Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة قوص وقفط الجزئية', nameEn: 'Qus & Qift Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة نقادة الجزئية', nameEn: 'Naqada Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة دشنا والوقف الجزئية', nameEn: 'Deshna & El Waqf Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة نجع حمادي الجزئية', nameEn: 'Nag Hammadi Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },
    { nameAr: 'محكمة فرشوط وأبو تشت الجزئية', nameEn: 'Farshut & Abu Tesht Partial Court', govKey: 'Qena', parentEn: 'Qena Primary Court' },

    // ── Luxor (الأقصر) ──
    { nameAr: 'محكمة بندر ومركز الأقصر الجزئية', nameEn: 'Luxor Partial Court', govKey: 'Luxor', parentEn: 'Luxor Primary Court' },
    { nameAr: 'محكمة القرنة والبياضية الجزئية', nameEn: 'Qurna & Bayadiya Partial Court', govKey: 'Luxor', parentEn: 'Luxor Primary Court' },
    { nameAr: 'محكمة أرمنت الجزئية', nameEn: 'Armant Partial Court', govKey: 'Luxor', parentEn: 'Luxor Primary Court' },
    { nameAr: 'محكمة إسنا الجزئية', nameEn: 'Esna Partial Court', govKey: 'Luxor', parentEn: 'Luxor Primary Court' },

    // ── Aswan (أسوان) ──
    { nameAr: 'محكمة بندر ومركز أسوان الجزئية', nameEn: 'Aswan Partial Court', govKey: 'Aswan', parentEn: 'Aswan Primary Court' },
    { nameAr: 'محكمة دراو الجزئية', nameEn: 'Daraw Partial Court', govKey: 'Aswan', parentEn: 'Aswan Primary Court' },
    { nameAr: 'محكمة كوم أمبو الجزئية', nameEn: 'Kom Ombo Partial Court', govKey: 'Aswan', parentEn: 'Aswan Primary Court' },
    { nameAr: 'محكمة نصر النوبة الجزئية', nameEn: 'Nasr El Nuba Partial Court', govKey: 'Aswan', parentEn: 'Aswan Primary Court' },
    { nameAr: 'محكمة إدفو الجزئية', nameEn: 'Edfu Partial Court', govKey: 'Aswan', parentEn: 'Aswan Primary Court' },

    // ── Red Sea (البحر الأحمر) ──
    { nameAr: 'محكمة الغردقة الجزئية', nameEn: 'Hurghada Partial Court', govKey: 'Red Sea', parentEn: 'Red Sea (Hurghada) Primary Court' },
    { nameAr: 'محكمة سفاجا والقصير الجزئية', nameEn: 'Safaga & El Qoseir Partial Court', govKey: 'Red Sea', parentEn: 'Red Sea (Hurghada) Primary Court' },
    { nameAr: 'محكمة رأس غارب الجزئية', nameEn: 'Ras Gharib Partial Court', govKey: 'Red Sea', parentEn: 'Red Sea (Hurghada) Primary Court' },
    { nameAr: 'محكمة مرسى علم والشلاتين الجزئية', nameEn: 'Marsa Alam & Shalateen Partial Court', govKey: 'Red Sea', parentEn: 'Red Sea (Hurghada) Primary Court' },

    // ── New Valley (الوادي الجديد) ──
    { nameAr: 'محكمة الخارجة وباريس الجزئية', nameEn: 'Kharga & Baris Partial Court', govKey: 'New Valley', parentEn: 'New Valley Primary Court' },
    { nameAr: 'محكمة الداخلة وبلاط والفرافرة الجزئية', nameEn: 'Dakhla & Farafra Partial Court', govKey: 'New Valley', parentEn: 'New Valley Primary Court' },

    // ── Matrouh (مطروح) ──
    { nameAr: 'محكمة مرسى مطروح والنجيلة الجزئية', nameEn: 'Marsa Matrouh Partial Court', govKey: 'Matrouh', parentEn: 'Marsa Matrouh Primary Court' },
    { nameAr: 'محكمة الحمام والعلمين والضبعة الجزئية', nameEn: 'El Hammam & El Alamein Partial Court', govKey: 'Matrouh', parentEn: 'Marsa Matrouh Primary Court' },
    { nameAr: 'محكمة سيدي براني والسلوم الجزئية', nameEn: 'Sidi Barrani & Salloum Partial Court', govKey: 'Matrouh', parentEn: 'Marsa Matrouh Primary Court' },
    { nameAr: 'محكمة سيوة الجزئية', nameEn: 'Siwa Partial Court', govKey: 'Matrouh', parentEn: 'Marsa Matrouh Primary Court' },

    // ── North Sinai (شمال سيناء) ──
    { nameAr: 'محكمة العريش الجزئية', nameEn: 'Arish Partial Court', govKey: 'North Sinai', parentEn: 'North Sinai (Arish) Primary Court' },
    { nameAr: 'محكمة بئر العبد والحسنة الجزئية', nameEn: 'Bir al-Abed Partial Court', govKey: 'North Sinai', parentEn: 'North Sinai (Arish) Primary Court' },
    { nameAr: 'محكمة الشيخ زويد ورفح الجزئية', nameEn: 'Sheikh Zuweid & Rafah Partial Court', govKey: 'North Sinai', parentEn: 'North Sinai (Arish) Primary Court' },

    // ── South Sinai (جنوب سيناء) ──
    { nameAr: 'محكمة طور سيناء الجزئية', nameEn: 'El Tor Partial Court', govKey: 'South Sinai', parentEn: 'South Sinai (El Tor) Primary Court' },
    { nameAr: 'محكمة شرم الشيخ ودهب ونويبع الجزئية', nameEn: 'Sharm el-Sheikh & Dahab Partial Court', govKey: 'South Sinai', parentEn: 'South Sinai (El Tor) Primary Court' },
    { nameAr: 'محكمة رأس سدر وأبو رديس الجزئية', nameEn: 'Ras Sudr & Abu Rudeis Partial Court', govKey: 'South Sinai', parentEn: 'South Sinai (El Tor) Primary Court' },
  ];
  await Promise.all(
    partialData.map(p =>
      prisma.court.create({
        data: {
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          type: CourtType.PARTIAL,
          governorateId: gov[p.govKey].id,
          parentCourtId: primaryMap[p.parentEn]?.id,
        },
      })
    )
  );


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

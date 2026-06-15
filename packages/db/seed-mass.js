"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:xIuBQcghskvgpZhKCwZNTGkHikBHpjgg@thomas.proxy.rlwy.net:22228/railway"
        }
    }
});
var firstNames = ['Ali', 'Ayşe', 'Can', 'Elif', 'Burak', 'Zehra', 'Emre', 'Merve', 'Kaan', 'Ceren', 'Onur', 'İrem', 'Deniz', 'Selin', 'Ozan', 'Ece', 'Görkem', 'Ezgi', 'Batuhan', 'Duygu', 'Mert', 'Tuğçe', 'Oğuz', 'Gizem', 'Kerem'];
var lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Öz', 'Korkmaz', 'Erdoğan', 'Yavuz', 'Can'];
var jobTitles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Product Manager', 'UX/UI Designer', 'DevOps Engineer', 'Mobile Developer', 'QA Engineer', 'System Administrator', 'Marketing Manager', 'Content Creator', 'Sales Representative', 'HR Specialist', 'Graphic Designer', 'Business Analyst'];
var skillsList = ['React', 'Node.js', 'Python', 'Figma', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Next.js', 'TailwindCSS', 'SQL', 'MongoDB', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift', 'Flutter', 'React Native'];
var companyNames = ['InnovateX', 'DataFlow', 'CloudSys', 'NextGen Solutions', 'VisionaryTech', 'Pioneer Apps', 'Nexus Corp', 'Stellar AI', 'Quantum Tech', 'Apex Software', 'Horizon Labs', 'Alpha Digital', 'Omega Systems', 'Peak Performance', 'Summit Technologies', 'Crest Solutions', 'Zenith Software', 'Pinnacle Tech', 'Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp', 'Stark Industries', 'Wayne Enterprises'];
var sectors = ['Yazılım', 'Finans', 'Sağlık', 'Eğitim', 'E-ticaret', 'Lojistik', 'Üretim', 'Telekomünikasyon', 'Medya', 'Otomotiv', 'Enerji', 'Perakende', 'Tarım', 'Turizm', 'İnşaat'];
var jobDescriptions = [
    'Ekibimize katılacak deneyimli bir çalışma arkadaşı arıyoruz. Modern teknolojilerle geliştirdiğimiz projelerde yer alarak şirketimizin büyümesine katkıda bulunacaksınız.',
    'Yenilikçi vizyonumuzu paylaşan, öğrenmeye ve kendini geliştirmeye açık takım arkadaşları arıyoruz. Esnek çalışma saatleri ve harika yan haklar sunuyoruz.',
    'Büyüyen ekibimiz için dinamik, sorumluluk sahibi ve takım çalışmasına yatkın profesyoneller arıyoruz. Uluslararası projelerde yer alma fırsatı!',
    'Sektöründe öncü şirketimizde kariyerinize yön verin. Güçlü altyapımız ve vizyoner projelerimizle geleceği birlikte inşa edelim.'
];
var postContents = [
    'Bugün harika bir projeyi tamamladık! Ekip çalışmasının önemini bir kez daha anladım. #başarı #takımçalışması',
    'Yeni bir teknoloji öğrenmek her zaman heyecan verici. Son günlerde bu konuya odaklandım ve sonuçlardan çok memnunum.',
    'Sektördeki son gelişmeleri takip etmek başarı için kritik öneme sahip. Sürekli öğrenme ve adaptasyon şart.',
    'Harika bir haftayı geride bıraktık. Önümüzdeki hafta için hedeflerimizi belirledik ve sabırsızlıkla çalışmaya başlamayı bekliyoruz.',
    'Kariyer yolculuğumda yeni bir sayfa açıyorum. Destekleyen herkese teşekkürler!',
    'Yeni bir iş arayışındayım. İlgilenenler profilime göz atabilir.'
];
var companyPostContents = [
    'Şirketimiz hızla büyümeye devam ediyor! Yeni yetenekleri ekibimizde görmekten mutluluk duyarız.',
    'Son ürünümüzü duyurmaktan gurur duyuyoruz. Müşterilerimize en iyi deneyimi sunmak için çalışıyoruz.',
    'Sektör lideri olarak yenilikçi çözümler sunmaya devam ediyoruz. Bizi takip etmeye devam edin!',
    'Harika bir ekip etkinliği gerçekleştirdik. Takım ruhumuz her geçen gün güçleniyor.',
    'Yeni ofisimize taşındık! Daha modern ve ferah bir çalışma ortamıyla ekibimizin motivasyonunu artırmayı hedefliyoruz.'
];
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomElements(arr, count) {
    var shuffled = arr.slice().sort(function () { return 0.5 - Math.random(); });
    return shuffled.slice(0, count);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var i, fn, ln, title, email, user, userSkills, _i, userSkills_1, skill, dbSkill, profile, i, cName, sector, email, user, jobCount, j, jTitle, reqs, jobPosting, _a, reqs_1, req, skill;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('20 Kullanıcı ve 20 Şirket oluşturuluyor...');
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < 20)) return [3 /*break*/, 11];
                    fn = getRandomElement(firstNames);
                    ln = getRandomElement(lastNames);
                    title = getRandomElement(jobTitles);
                    email = "mockuser_".concat(Date.now(), "_").concat(i, "@example.com");
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: fn,
                                surname: ln,
                                email: email,
                                role: 'user',
                                image: "https://ui-avatars.com/api/?name=".concat(fn, "+").concat(ln, "&background=random"),
                                profile: {
                                    create: {
                                        bio: "".concat(title, " olarak \u00E7al\u0131\u015F\u0131yorum. Yeni teknolojileri \u00F6\u011Frenmeyi ve uygulamay\u0131 seviyorum."),
                                        location: 'İstanbul, Türkiye',
                                        workingFields: getRandomElements(skillsList, 3),
                                        experiences: {
                                            create: [
                                                {
                                                    title: title,
                                                    corp: getRandomElement(companyNames),
                                                    type: 'WORK',
                                                    locType: 'HYBRID',
                                                    startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
                                                    desc: 'Bu şirkette harika projelere imza attık.',
                                                }
                                            ]
                                        },
                                        educations: {
                                            create: [
                                                {
                                                    instName: 'Örnek Üniversitesi',
                                                    instDegree: 'Lisans',
                                                    instProgram: 'Mühendislik',
                                                    startDate: new Date('2015-09-01'),
                                                    endDate: new Date('2019-06-01'),
                                                }
                                            ]
                                        }
                                    }
                                },
                                posts: {
                                    create: [
                                        {
                                            content: getRandomElement(postContents)
                                        }
                                    ]
                                }
                            }
                        })];
                case 2:
                    user = _b.sent();
                    userSkills = getRandomElements(skillsList, Math.floor(Math.random() * 3) + 2);
                    _i = 0, userSkills_1 = userSkills;
                    _b.label = 3;
                case 3:
                    if (!(_i < userSkills_1.length)) return [3 /*break*/, 10];
                    skill = userSkills_1[_i];
                    return [4 /*yield*/, prisma.skill.findUnique({ where: { skillName: skill } })];
                case 4:
                    dbSkill = _b.sent();
                    if (!!dbSkill) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.skill.create({ data: { skillName: skill } })];
                case 5:
                    dbSkill = _b.sent();
                    _b.label = 6;
                case 6: return [4 /*yield*/, prisma.profile.findUnique({ where: { userId: user.id } })];
                case 7:
                    profile = _b.sent();
                    if (!profile) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.userSkill.create({
                            data: {
                                profileId: profile.id,
                                skillId: dbSkill.skillId
                            }
                        })];
                case 8:
                    _b.sent();
                    _b.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 3];
                case 10:
                    i++;
                    return [3 /*break*/, 1];
                case 11:
                    console.log('20 Kullanıcı başarıyla oluşturuldu.');
                    i = 0;
                    _b.label = 12;
                case 12:
                    if (!(i < 20)) return [3 /*break*/, 24];
                    cName = getRandomElement(companyNames) + ' ' + (Math.floor(Math.random() * 1000));
                    sector = getRandomElement(sectors);
                    email = "mockcompany_".concat(Date.now(), "_").concat(i, "@example.com");
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: cName,
                                surname: 'A.Ş.',
                                email: email,
                                role: 'company',
                                sector: sector,
                                image: "https://ui-avatars.com/api/?name=".concat(encodeURIComponent(cName), "&background=random"),
                                profile: {
                                    create: {
                                        bio: "".concat(sector, " sekt\u00F6r\u00FCnde \u00F6nc\u00FC bir \u015Firketiz. \u0130novasyon ve teknoloji odakl\u0131 \u00E7\u00F6z\u00FCmler sunuyoruz."),
                                        location: 'İstanbul, Türkiye',
                                        workingFields: [sector],
                                    }
                                },
                                posts: {
                                    create: [
                                        {
                                            content: getRandomElement(companyPostContents)
                                        }
                                    ]
                                }
                            }
                        })];
                case 13:
                    user = _b.sent();
                    jobCount = Math.floor(Math.random() * 3) + 1;
                    j = 0;
                    _b.label = 14;
                case 14:
                    if (!(j < jobCount)) return [3 /*break*/, 23];
                    jTitle = getRandomElement(jobTitles);
                    reqs = getRandomElements(skillsList, 2);
                    return [4 /*yield*/, prisma.jobPosting.create({
                            data: {
                                publisherId: user.id,
                                title: jTitle,
                                description: getRandomElement(jobDescriptions),
                                type: Math.random() > 0.5 ? 'CORPORATE' : 'FREELANCE',
                            }
                        })];
                case 15:
                    jobPosting = _b.sent();
                    _a = 0, reqs_1 = reqs;
                    _b.label = 16;
                case 16:
                    if (!(_a < reqs_1.length)) return [3 /*break*/, 22];
                    req = reqs_1[_a];
                    return [4 /*yield*/, prisma.skill.findUnique({ where: { skillName: req } })];
                case 17:
                    skill = _b.sent();
                    if (!!skill) return [3 /*break*/, 19];
                    return [4 /*yield*/, prisma.skill.create({ data: { skillName: req } })];
                case 18:
                    skill = _b.sent();
                    _b.label = 19;
                case 19: return [4 /*yield*/, prisma.jobPosting.update({
                        where: { id: jobPosting.id },
                        data: {
                            requirements: { connect: { skillId: skill.skillId } }
                        }
                    })];
                case 20:
                    _b.sent();
                    _b.label = 21;
                case 21:
                    _a++;
                    return [3 /*break*/, 16];
                case 22:
                    j++;
                    return [3 /*break*/, 14];
                case 23:
                    i++;
                    return [3 /*break*/, 12];
                case 24:
                    console.log('20 Şirket ve ilanları başarıyla oluşturuldu.');
                    console.log('Tüm işlemler başarıyla tamamlandı!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });

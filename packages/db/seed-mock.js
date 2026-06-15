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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var admins, _i, admins_1, email, res, dummyUsers, _a, dummyUsers_1, u, user, profile, _b, _c, s, skill, dummyCompanies, _d, dummyCompanies_1, c, company, profile, _e, _f, job, jobPosting, _g, _h, req, skill;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log('Canlı Veritabanına Bağlanıldı. Admin hesapları güncelleniyor...');
                    admins = ['collabswipe@collabswipe.com', 'oggy4469@gmail.com', 'alper@gmail.com'];
                    _i = 0, admins_1 = admins;
                    _j.label = 1;
                case 1:
                    if (!(_i < admins_1.length)) return [3 /*break*/, 4];
                    email = admins_1[_i];
                    return [4 /*yield*/, prisma.user.updateMany({
                            where: { email: email },
                            data: { role: 'admin' },
                        })];
                case 2:
                    res = _j.sent();
                    console.log("".concat(email, " i\u00E7in ").concat(res.count, " kay\u0131t g\u00FCncellendi."));
                    _j.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('\nSahte Kullanıcılar oluşturuluyor...');
                    dummyUsers = [
                        {
                            name: 'Ahmet',
                            surname: 'Yılmaz',
                            email: 'ahmet.yilmaz.mock@example.com',
                            image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80',
                            role: 'user',
                            bio: 'Full Stack Developer | React & Node.js tutkunu. Yeni teknolojiler öğrenmeyi ve açık kaynak projelere katkıda bulunmayı seviyorum.',
                            location: 'İstanbul, Türkiye',
                            workingFields: ['Yazılım Geliştirme', 'Web Programlama'],
                            skills: ['React', 'Node.js', 'TypeScript', 'SQL']
                        },
                        {
                            name: 'Zeynep',
                            surname: 'Kaya',
                            email: 'zeynep.kaya.mock@example.com',
                            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
                            role: 'user',
                            bio: 'UI/UX Tasarımcısı. Kullanıcı odaklı dijital deneyimler tasarlıyorum. Renkler ve tipografi ile oynamak en sevdiğim şey.',
                            location: 'İzmir, Türkiye',
                            workingFields: ['Tasarım', 'UI/UX'],
                            skills: ['Figma', 'Adobe Photoshop', 'UI/UX Tasarımı', 'İletişim']
                        }
                    ];
                    _a = 0, dummyUsers_1 = dummyUsers;
                    _j.label = 5;
                case 5:
                    if (!(_a < dummyUsers_1.length)) return [3 /*break*/, 19];
                    u = dummyUsers_1[_a];
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: u.email } })];
                case 6:
                    user = _j.sent();
                    if (!!user) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: u.name,
                                surname: u.surname,
                                email: u.email,
                                image: u.image,
                                role: u.role,
                            }
                        })];
                case 7:
                    user = _j.sent();
                    return [4 /*yield*/, prisma.profile.create({
                            data: {
                                userId: user.id,
                                bio: u.bio,
                                location: u.location,
                                workingFields: u.workingFields,
                            }
                        })];
                case 8:
                    profile = _j.sent();
                    _b = 0, _c = u.skills;
                    _j.label = 9;
                case 9:
                    if (!(_b < _c.length)) return [3 /*break*/, 15];
                    s = _c[_b];
                    return [4 /*yield*/, prisma.skill.findUnique({ where: { skillName: s } })];
                case 10:
                    skill = _j.sent();
                    if (!!skill) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma.skill.create({ data: { skillName: s } })];
                case 11:
                    skill = _j.sent();
                    _j.label = 12;
                case 12: return [4 /*yield*/, prisma.userSkill.create({
                        data: { profileId: profile.id, skillId: skill.skillId }
                    })];
                case 13:
                    _j.sent();
                    _j.label = 14;
                case 14:
                    _b++;
                    return [3 /*break*/, 9];
                case 15: return [4 /*yield*/, prisma.post.create({
                        data: {
                            authorId: user.id,
                            content: "Herkese merhaba! collabswipe'a yeni kat\u0131ld\u0131m. ".concat(u.workingFields.join(', '), " alanlar\u0131nda \u00E7al\u0131\u015F\u0131yorum. Tan\u0131\u015Ft\u0131\u011F\u0131m\u0131za memnun oldum!"),
                        }
                    })];
                case 16:
                    _j.sent();
                    console.log("".concat(u.name, " kullan\u0131c\u0131s\u0131 olu\u015Fturuldu."));
                    return [3 /*break*/, 18];
                case 17:
                    console.log("".concat(u.name, " zaten mevcut."));
                    _j.label = 18;
                case 18:
                    _a++;
                    return [3 /*break*/, 5];
                case 19:
                    console.log('\nSahte Şirketler (İşverenler) oluşturuluyor...');
                    dummyCompanies = [
                        {
                            name: 'TechNova',
                            surname: 'Yazılım Çözümleri',
                            email: 'hr@technova.mock.com',
                            image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
                            role: 'company',
                            sector: 'Bilişim Teknolojileri',
                            bio: 'TechNova olarak kurumların dijital dönüşüm süreçlerine liderlik ediyoruz. İnovatif yazılım çözümleri üretiyoruz.',
                            location: 'Ankara, Türkiye',
                            jobs: [
                                {
                                    title: 'Senior Frontend Developer',
                                    description: 'React ve modern web teknolojilerinde en az 4 yıl deneyimli takım arkadaşı arıyoruz. Güçlü problem çözme yeteneğine sahip olmalısınız.',
                                    type: 'CORPORATE',
                                    reqs: ['React', 'TypeScript', 'Tailwind CSS']
                                },
                                {
                                    title: 'Freelance UI Designer',
                                    description: 'Yeni mobil uygulamamızın arayüzlerini tasarlayacak yetenekli bir freelance tasarımcı arıyoruz.',
                                    type: 'FREELANCE',
                                    reqs: ['Figma', 'UI/UX Tasarımı']
                                }
                            ]
                        },
                        {
                            name: 'GlobalTech',
                            surname: 'A.Ş.',
                            email: 'info@globaltech.mock.com',
                            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
                            role: 'company',
                            sector: 'E-Ticaret',
                            bio: 'Türkiye\'nin hızla büyüyen e-ticaret altyapı sağlayıcısı.',
                            location: 'İstanbul, Türkiye',
                            jobs: [
                                {
                                    title: 'Backend Engineer (Node.js)',
                                    description: 'Mikroservis mimarisinde tecrübeli Node.js geliştiricisi arıyoruz. High-traffic sistemlerde deneyim şarttır.',
                                    type: 'CORPORATE',
                                    reqs: ['Node.js', 'PostgreSQL', 'Redis', 'Docker']
                                }
                            ]
                        }
                    ];
                    _d = 0, dummyCompanies_1 = dummyCompanies;
                    _j.label = 20;
                case 20:
                    if (!(_d < dummyCompanies_1.length)) return [3 /*break*/, 37];
                    c = dummyCompanies_1[_d];
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: c.email } })];
                case 21:
                    company = _j.sent();
                    if (!!company) return [3 /*break*/, 35];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: c.name,
                                surname: c.surname,
                                email: c.email,
                                image: c.image,
                                role: c.role,
                                sector: c.sector
                            }
                        })];
                case 22:
                    company = _j.sent();
                    return [4 /*yield*/, prisma.profile.create({
                            data: {
                                userId: company.id,
                                bio: c.bio,
                                location: c.location,
                            }
                        })];
                case 23:
                    profile = _j.sent();
                    _e = 0, _f = c.jobs;
                    _j.label = 24;
                case 24:
                    if (!(_e < _f.length)) return [3 /*break*/, 33];
                    job = _f[_e];
                    return [4 /*yield*/, prisma.jobPosting.create({
                            data: {
                                publisherId: company.id,
                                title: job.title,
                                description: job.description,
                                type: job.type,
                            }
                        })];
                case 25:
                    jobPosting = _j.sent();
                    _g = 0, _h = job.reqs;
                    _j.label = 26;
                case 26:
                    if (!(_g < _h.length)) return [3 /*break*/, 32];
                    req = _h[_g];
                    return [4 /*yield*/, prisma.skill.findUnique({ where: { skillName: req } })];
                case 27:
                    skill = _j.sent();
                    if (!!skill) return [3 /*break*/, 29];
                    return [4 /*yield*/, prisma.skill.create({ data: { skillName: req } })];
                case 28:
                    skill = _j.sent();
                    _j.label = 29;
                case 29: return [4 /*yield*/, prisma.jobPosting.update({
                        where: { id: jobPosting.id },
                        data: {
                            requirements: { connect: { skillId: skill.skillId } }
                        }
                    })];
                case 30:
                    _j.sent();
                    _j.label = 31;
                case 31:
                    _g++;
                    return [3 /*break*/, 26];
                case 32:
                    _e++;
                    return [3 /*break*/, 24];
                case 33: return [4 /*yield*/, prisma.post.create({
                        data: {
                            authorId: company.id,
                            content: "".concat(c.name, " olarak yeni yetenekler ar\u0131yoruz! \u0130lanlar\u0131m\u0131za g\u00F6z atmay\u0131 unutmay\u0131n."),
                        }
                    })];
                case 34:
                    _j.sent();
                    console.log("".concat(c.name, " \u015Firketi olu\u015Fturuldu ve ilanlar\u0131 eklendi."));
                    return [3 /*break*/, 36];
                case 35:
                    console.log("".concat(c.name, " zaten mevcut."));
                    _j.label = 36;
                case 36:
                    _d++;
                    return [3 /*break*/, 20];
                case 37:
                    console.log('Tüm işlemler tamamlandı!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });

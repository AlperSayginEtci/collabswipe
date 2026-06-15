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
        var users, _i, users_1, u, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Deneyim ve eğitim verileri ekleniyor...');
                    users = [
                        { email: 'ahmet.yilmaz.mock@example.com', role: 'user' },
                        { email: 'zeynep.kaya.mock@example.com', role: 'user' }
                    ];
                    _i = 0, users_1 = users;
                    _a.label = 1;
                case 1:
                    if (!(_i < users_1.length)) return [3 /*break*/, 11];
                    u = users_1[_i];
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: u.email }, include: { profile: true } })];
                case 2:
                    user = _a.sent();
                    if (!(user && user.profile)) return [3 /*break*/, 10];
                    if (!(u.email === 'ahmet.yilmaz.mock@example.com')) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.experience.create({
                            data: {
                                profileId: user.profile.id,
                                title: 'Senior Frontend Developer',
                                corp: 'TechNova',
                                type: 'WORK',
                                locType: 'REMOTE',
                                startDate: new Date('2021-06-01'),
                                desc: 'React ve Next.js kullanarak yüksek performanslı e-ticaret altyapıları geliştirdim.',
                            }
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.education.create({
                            data: {
                                profileId: user.profile.id,
                                instName: 'Orta Doğu Teknik Üniversitesi',
                                instDegree: 'Lisans',
                                instProgram: 'Bilgisayar Mühendisliği',
                                startDate: new Date('2015-09-01'),
                                endDate: new Date('2019-06-01'),
                            }
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.certificate.create({
                            data: {
                                profileId: user.profile.id,
                                title: 'AWS Certified Developer',
                                org: 'Amazon Web Services',
                                startDate: new Date('2022-05-15'),
                                competencyURL: 'https://aws.amazon.com',
                            }
                        })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 6:
                    if (!(u.email === 'zeynep.kaya.mock@example.com')) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.experience.create({
                            data: {
                                profileId: user.profile.id,
                                title: 'Lead UI/UX Designer',
                                corp: 'GlobalTech A.Ş.',
                                type: 'WORK',
                                locType: 'ONSITE',
                                startDate: new Date('2020-03-01'),
                                desc: 'Mobil ve web platformlarında yüz binlerce kullanıcının kullandığı arayüzleri tasarladım.',
                            }
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.education.create({
                            data: {
                                profileId: user.profile.id,
                                instName: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
                                instDegree: 'Lisans',
                                instProgram: 'Grafik Tasarımı',
                                startDate: new Date('2014-09-01'),
                                endDate: new Date('2018-06-01'),
                            }
                        })];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    console.log("".concat(user.name, " kullan\u0131c\u0131s\u0131na veriler eklendi."));
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11:
                    console.log('İşlem tamamlandı!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });

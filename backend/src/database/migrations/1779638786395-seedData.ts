import { MigrationInterface, QueryRunner } from 'typeorm';
import { DoctorLevel } from '../../shared/enums/doctorLevel';

export class SeedData1779638786395 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                                                        INSERT INTO "roles" ("role_name", "description", "role_code") VALUES
                                                        ('ADMIN', 'Administrator role', 10001),
                                                        ('DOCTOR', 'Doctor role', 10002),
                                                        ('PATIENT', 'Patient role', 10003)
                                                      `);

    const permissions = [
      { id: 1, name: 'auth:login' },
      { id: 2, name: 'auth:logout' },
      { id: 3, name: 'auth:refresh' },
      { id: 4, name: 'auth:register' },
      { id: 5, name: 'auth:google-login' },
      { id: 6, name: 'auth:set-password' },
      { id: 7, name: 'user:create' },
      { id: 8, name: 'user:read' },
      { id: 9, name: 'user:update' },
      { id: 10, name: 'user:delete' },
      { id: 11, name: 'user:lock' },
      { id: 12, name: 'user:unlock' },
      { id: 13, name: 'user:activate' },
      { id: 14, name: 'user:deactivate' },
      { id: 15, name: 'user:update-role' },
      { id: 16, name: 'user:manage' },
      { id: 17, name: 'patient:create' },
      { id: 18, name: 'patient:read' },
      { id: 19, name: 'patient:update' },
      { id: 20, name: 'patient:delete' },
      { id: 21, name: 'patient:manage' },
      { id: 22, name: 'doctor:create' },
      { id: 23, name: 'doctor:read' },
      { id: 24, name: 'doctor:update' },
      { id: 25, name: 'doctor:delete' },
      { id: 26, name: 'doctor:manage' },
      { id: 27, name: 'appointment:create' },
      { id: 28, name: 'appointment:read' },
      { id: 29, name: 'appointment:update' },
      { id: 30, name: 'appointment:delete' },
      { id: 31, name: 'appointment:cancel' },
      { id: 32, name: 'appointment:update-status' },
      { id: 33, name: 'appointment:manage' },
      { id: 34, name: 'doctor-schedule:create' },
      { id: 35, name: 'doctor-schedule:read' },
      { id: 36, name: 'doctor-schedule:update' },
      { id: 37, name: 'doctor-schedule:delete' },
      { id: 38, name: 'doctor-schedule:update-status' },
      { id: 39, name: 'doctor-schedule:manage' },
      { id: 40, name: 'role:create' },
      { id: 41, name: 'role:read' },
      { id: 42, name: 'role:update' },
      { id: 43, name: 'role:delete' },
      { id: 44, name: 'role:manage' },
      { id: 45, name: 'permission:create' },
      { id: 46, name: 'permission:read' },
      { id: 47, name: 'permission:update' },
      { id: 48, name: 'permission:delete' },
      { id: 49, name: 'permission:manage' },
      { id: 50, name: 'role-permission:read' },
      { id: 51, name: 'role-permission:update' },
      { id: 52, name: 'role-permission:manage' },
      { id: 53, name: 'specialty:create' },
      { id: 54, name: 'specialty:read' },
      { id: 55, name: 'specialty:update' },
      { id: 56, name: 'specialty:delete' },
      { id: 57, name: 'specialty:manage' },
      { id: 58, name: 'topic:create' },
      { id: 59, name: 'topic:read' },
      { id: 60, name: 'topic:update' },
      { id: 61, name: 'topic:delete' },
      { id: 62, name: 'topic:manage' },
      { id: 63, name: 'tag:create' },
      { id: 64, name: 'tag:read' },
      { id: 65, name: 'tag:update' },
      { id: 66, name: 'tag:delete' },
      { id: 67, name: 'tag:manage' },
      { id: 68, name: 'article:create' },
      { id: 69, name: 'article:read' },
      { id: 70, name: 'article:update' },
      { id: 71, name: 'article:delete' },
      { id: 72, name: 'article:approve' },
      { id: 73, name: 'article:manage' },
      { id: 74, name: 'message:create' },
      { id: 75, name: 'message:read' },
      { id: 76, name: 'message:update' },
      { id: 77, name: 'message:delete' },
      { id: 78, name: 'message:manage' },
      { id: 79, name: 'channel:create' },
      { id: 80, name: 'channel:read' },
      { id: 81, name: 'channel:update' },
      { id: 82, name: 'channel:delete' },
      { id: 83, name: 'channel:manage' },
      { id: 84, name: 'relative:create' },
      { id: 85, name: 'relative:read' },
      { id: 86, name: 'relative:update' },
      { id: 87, name: 'relative:delete' },
      { id: 88, name: 'relative:manage' },
      { id: 89, name: 'relationship:create' },
      { id: 90, name: 'relationship:read' },
      { id: 91, name: 'relationship:update' },
      { id: 92, name: 'relationship:delete' },
      { id: 93, name: 'relationship:manage' },
      { id: 94, name: 'health-profile:create' },
      { id: 95, name: 'health-profile:read' },
      { id: 96, name: 'health-profile:update' },
      { id: 97, name: 'health-profile:delete' },
      { id: 98, name: 'health-profile:manage' },
      { id: 99, name: 'examination-result:create' },
      { id: 100, name: 'examination-result:read' },
      { id: 101, name: 'examination-result:update' },
      { id: 102, name: 'examination-result:delete' },
      { id: 103, name: 'examination-result:manage' },
      { id: 104, name: 'satisfaction-rating:create' },
      { id: 105, name: 'satisfaction-rating:read' },
      { id: 106, name: 'satisfaction-rating:update' },
      { id: 107, name: 'satisfaction-rating:delete' },
      { id: 108, name: 'satisfaction-rating:manage' },
      { id: 109, name: 'audit-log:read' },
      { id: 110, name: 'audit-log:manage' },
      { id: 111, name: 'complaint:create' },
      { id: 112, name: 'complaint:read' },
      { id: 113, name: 'complaint:update' },
      { id: 114, name: 'complaint:delete' },
      { id: 115, name: 'complaint:manage' },
      { id: 116, name: 'notification:create' },
      { id: 117, name: 'notification:read' },
      { id: 118, name: 'notification:update' },
      { id: 119, name: 'notification:delete' },
      { id: 120, name: 'notification:send' },
      { id: 121, name: 'notification:manage' },
      { id: 122, name: 'dashboard:patient' },
      { id: 123, name: 'dashboard:doctor' },
      { id: 124, name: 'dashboard:admin' },
      { id: 125, name: 'setting:read' },
      { id: 126, name: 'setting:update' },
      { id: 127, name: 'setting:manage' },
      { id: 128, name: 'patient-record:read' },
      { id: 129, name: 'patient-record:manage' },
      { id: 130, name: 'chatbot:chat' },
    ];

    for (let i = 0; i < permissions.length; i++) {
      await queryRunner.query(`
                                                  INSERT INTO "permissions" ("id", "name") VALUES
                                                          (${permissions[i].id}, '${permissions[i].name}')
                                                  `);
    }

    const permissionIdByName = new Map(
      permissions.map((permission) => [permission.name, permission.id]),
    );
    const adminPermissions = permissions.map((permission) => permission.name);
    const doctorPermissions = [
      'auth:login',
      'auth:logout',
      'auth:refresh',
      'dashboard:doctor',
      'user:read',
      'doctor:read',
      'doctor:update',
      'doctor-schedule:create',
      'doctor-schedule:read',
      'doctor-schedule:update',
      'doctor-schedule:delete',
      'doctor-schedule:update-status',
      'doctor-schedule:manage',
      'appointment:read',
      'appointment:update-status',
      'appointment:manage',
      'patient:read',
      'patient:manage',
      'patient-record:read',
      'patient-record:manage',
      'health-profile:read',
      'examination-result:create',
      'examination-result:read',
      'examination-result:update',
      'examination-result:delete',
      'examination-result:manage',
      'satisfaction-rating:read',
      'message:create',
      'message:read',
      'message:manage',
      'channel:create',
      'channel:read',
      'channel:manage',
      'article:create',
      'article:read',
      'article:update',
      'article:delete',
      'article:approve',
      'article:manage',
      'topic:read',
      'topic:manage',
      'tag:read',
      'tag:manage',
      'notification:read',
      'setting:read',
      'setting:update',
      'chatbot:chat',
    ];
    const patientPermissions = [
      'auth:login',
      'auth:logout',
      'auth:refresh',
      'auth:register',
      'auth:google-login',
      'auth:set-password',
      'dashboard:patient',
      'user:read',
      'user:update',
      'patient:read',
      'appointment:create',
      'appointment:read',
      'appointment:cancel',
      'relative:create',
      'relative:read',
      'relative:update',
      'relative:delete',
      'health-profile:create',
      'health-profile:read',
      'health-profile:update',
      'examination-result:read',
      'satisfaction-rating:create',
      'satisfaction-rating:read',
      'satisfaction-rating:update',
      'message:create',
      'message:read',
      'channel:create',
      'channel:read',
      'notification:read',
      'complaint:create',
      'complaint:read',
      'relationship:read',
      'specialty:read',
      'doctor:read',
      'doctor-schedule:read',
      'article:read',
      'topic:read',
      'tag:read',
      'chatbot:chat',
    ];
    const rolePermissionMap = [
      { roleId: 1, permissions: adminPermissions },
      { roleId: 2, permissions: doctorPermissions },
      { roleId: 3, permissions: patientPermissions },
    ];

    for (const { roleId, permissions: rolePermissions } of rolePermissionMap) {
      for (const permissionName of rolePermissions) {
        const permissionId = permissionIdByName.get(permissionName);
        if (!permissionId) {
          throw new Error(`Permission ${permissionName} not found`);
        }
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
          (${roleId}, ${permissionId})
        `);
      }
    }

    await queryRunner.query(
      `
                                                         INSERT INTO "specialties" ("name", "description", "img_url","slug") VALUES
                                                          ('Nội tổng quát', 'Khám và điều trị bệnh nội chung', 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png', 'noi-tong-quat'),
                                                          ('Nhi khoa', 'Khám và điều trị cho trẻ em', 'https://img.icons8.com/?size=100&id=p2d1FgnXor9x&format=png&color=000000', 'nhi-khoa'),
                                                          ('Tai - Mũi - Họng', 'Chuyên điều trị các bệnh tai, mũi, họng', 'https://img.icons8.com/?size=100&id=rTQ4En7AeuQ1&format=png&color=000000', 'tai-mui-hong'),
                                                          ('Tim mạch', 'Chuyên điều trị các bệnh lý tim', 'https://img.icons8.com/?size=100&id=iUw8YXRVW2S0&format=png&color=000000', 'tim-mach'),
                                                          ('Da liễu', 'Chuyên điều trị các bệnh da liễu', 'https://img.icons8.com/?size=100&id=MOj6Zjf10vZv&format=png&color=000000', 'da-lieu'),
                                                          ('Xương khớp', 'Chấn thương chỉnh hình và cơ xương khớp', 'https://img.icons8.com/?size=100&id=sAzBTj4hB0gT&format=png&color=000000', 'xuong-khop'),
                                                          ('Phụ sản', 'Chăm sóc sức khỏe sinh sản và thai kỳ', 'https://img.icons8.com/?size=100&id=Kk8ICotGvcA9&format=png&color=000000', 'phu-san'),
                                                          ('Tiêu hóa', 'Khám và điều trị các bệnh tiêu hóa', 'https://img.icons8.com/?size=100&id=EvRCUVdDhhgF&format=png&color=000000', 'tieu-hoa'),
                                                          ('Thần kinh', 'Điều trị các bệnh lý thần kinh', 'https://img.icons8.com/?size=100&id=Cuq2YZuRDrbi&format=png&color=000000', 'than-kinh'),
                                                          ('Mắt', 'Khám và điều trị các vấn đề về mắt', 'https://img.icons8.com/?size=100&id=113879&format=png&color=000000', 'mat'),
                                                          ('Răng - Hàm - Mặt', 'Khám và điều trị răng miệng và hàm mặt', 'https://img.icons8.com/?size=100&id=64450&format=png&color=000000', 'rang-ham-mat'),
                                                          ('Ung bướu', 'Chẩn đoán và điều trị ung thư', 'https://img.icons8.com/?size=100&id=LUYKebvCUxz9&format=png&color=000000', 'ung-buou'),
                                                          ('Hô hấp', 'Khám và điều trị các bệnh lý hô hấp', 'https://img.icons8.com/?size=100&id=Z3a9Q1E2ZCw3&format=png&color=000000', 'ho-hap'),
                                                          ('Thận - Tiết niệu', 'Chăm sóc hệ tiết niệu và thận', 'https://img.icons8.com/?size=100&id=81090&format=png&color=000000', 'than-tiet-nieu'),
                                                          ('Lão khoa', 'Chăm sóc sức khỏe người cao tuổi', 'https://img.icons8.com/?size=100&id=ysp3HiIhyRdn&format=png&color=000000', 'lao-khoa');
                                                      `,
    );

    await queryRunner.query(`
                                                        INSERT INTO "users" ("username", "email", "password", "phone", "fullname", "gender", "date_of_birth", "picture", "address", "isAdmin")
                                                        VALUES ('admin01', 'admin@clinic.vn', '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK', '0900000001', 'Quản trị viên', true, '1980-01-01', NULL, 'Hà Nội', true)
                                                      `);
    await queryRunner.query(
      `INSERT INTO "user_roles" ("user_id", "role_id") VALUES (1, 1)`,
    );

    const patients = [
      {
        username: 'nguyenvanbinh',
        email: 'nguyenvanbinh@clinic.vn',
        phone: '0901000001',
        fullname: 'Nguyễn Văn Bình',
        gender: true,
        dob: '1990-01-01',
        address:
          'Số 101, Đường Trần Phú, Phường Điện Biên, Quận Ba Đình, Hà Nội',
        picture: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'tranthibichha',
        email: 'tranthibichha@clinic.vn',
        phone: '0901000002',
        fullname: 'Trần Thị Bích Hà',
        gender: false,
        dob: '1985-03-15',
        address: 'Số 202, Đường Lý Tự Trọng, Phường Bến Thành, Quận 1, TP.HCM',
        picture: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'phamvanhau',
        email: 'phamvanhau@clinic.vn',
        phone: '0901000003',
        fullname: 'Phạm Văn Hậu',
        gender: true,
        dob: '1992-07-20',
        address:
          'Số 303, Đường Nguyễn Văn Linh, Phường Hòa Thuận Đông, Quận Hải Châu, Đà Nẵng',
        picture: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'lethicamtu',
        email: 'lethicamtu@clinic.vn',
        phone: '0901000004',
        fullname: 'Lê Thị Cẩm Tú',
        gender: false,
        dob: '1988-05-10',
        address:
          'Số 404, Đường Hùng Vương, Phường Phú Hội, TP. Huế, Thừa Thiên Huế',
        picture: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'hoangvanduy',
        email: 'hoangvanduy@clinic.vn',
        phone: '0901000005',
        fullname: 'Hoàng Văn Duy',
        gender: true,
        dob: '1995-11-30',
        address:
          'Số 505, Đường 30/4, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
        picture: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
    ];

    for (let i = 0; i < patients.length; i++) {
      const id = i + 2;
      const {
        username,
        email,
        phone,
        fullname,
        gender,
        dob,
        address,
        picture,
        password,
      } = patients[i];

      await queryRunner.query(`
                                                          INSERT INTO "users" ("id","username", "email", "password", "phone", "fullname", "gender", "date_of_birth", "picture", "address", "isAdmin")
                                                          VALUES (${id},'${username}', '${email}', '${password}', '${phone}', '${fullname}', '${gender}', '${dob}', '${picture}', '${address}', false)
                                                        `);

      await queryRunner.query(
        `INSERT INTO "user_roles" ("user_id", "role_id") VALUES (${id}, 3)`,
      );
    }

    //Dữ liệu về các mối quan hệ gia đình
    const relationships = [
      { relationship_code: 'ban_than', relationship_name: 'Bản Thân' },
      { relationship_code: 'cha', relationship_name: 'Cha' },
      { relationship_code: 'me', relationship_name: 'Mẹ' },
      { relationship_code: 'vo_chong', relationship_name: 'Vợ/Chồng' },
      { relationship_code: 'con_trai', relationship_name: 'Con Trai' },
      { relationship_code: 'con_gai', relationship_name: 'Con Gái' },
      { relationship_code: 'ong', relationship_name: 'Ông' },
      { relationship_code: 'ba', relationship_name: 'Bà' },
      {
        relationship_code: 'nguoi_than_khac',
        relationship_name: 'Người Thân Khác',
      },
    ];

    for (let i = 0; i < relationships.length; i++) {
      const { relationship_code, relationship_name } = relationships[i];
      await queryRunner.query(`
                               INSERT INTO "relationships" ("relationship_code", "relationship_name")
                               VALUES ('${relationship_code}', '${relationship_name}')
                             `);
    }

    //Dữ liệu về bác sĩ
    const doctors = [
      {
        username: 'bs.levanminh',
        email: 'bs.levanminh@clinic.vn',
        phone: '0900000002',
        fullname: 'Lê Văn Minh',
        gender: true,
        dob: '1975-03-10',
        address: 'Số 90, Đường Hai Bà Trưng, Phường Đa Kao, Quận 1, TP.HCM',
        experience: 18,
        about_me:
          'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II Nội tổng quát với hơn 18 năm kinh nghiệm tại Bệnh viện Chợ Rẫy. Tốt nghiệp loại xuất sắc từ Đại học Y Dược Thành phố Hồ Chí Minh. Được cấp chứng chỉ chuyên sâu về nội soi tiêu hóa, điều trị bệnh lý mãn tính và quản lý bệnh không lây. Thường xuyên tham gia hội thảo y học quốc tế và là giảng viên thỉnh giảng tại các trường đại học y khoa.',
        doctor_level: DoctorLevel.TS,
        workplace: 'Bệnh viện Chợ Rẫy',
        specialty_id: 1,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2010/01/pgs-trieu-trieu-duong.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.nguyenthilan',
        email: 'bs.nguyenthilan@clinic.vn',
        phone: '0900000003',
        fullname: 'Nguyễn Thị Lan',
        gender: false,
        dob: '1980-05-22',
        address: 'Số 23, Đường Hoàng Diệu, Phường 12, Quận 4, TP.HCM',
        experience: 16,
        about_me:
          'Thạc sĩ Y học Nội tổng quát với hơn 16 năm kinh nghiệm trong điều trị các bệnh lý mãn tính như tăng huyết áp, tiểu đường, rối loạn mỡ máu. Tốt nghiệp Đại học Y Dược Cần Thơ. Là hội viên tích cực của Hội Nội khoa Việt Nam. Được đào tạo chuyên sâu về quản lý sức khỏe cộng đồng và tư vấn dinh dưỡng tại Singapore.',
        doctor_level: DoctorLevel.THS,
        workplace: 'Bệnh viện Nhân dân Gia Định',
        specialty_id: 1,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bac-si-nguyen-ba-my-nhi-detail-8.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.phamquochung',
        email: 'bs.phamquochung@clinic.vn',
        phone: '0900000004',
        fullname: 'Phạm Quốc Hưng',
        gender: true,
        dob: '1983-07-15',
        address: 'Số 45, Đường Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng',
        experience: 14,
        about_me:
          'Bác sĩ chuyên khoa Nhi với hơn 14 năm kinh nghiệm tại Bệnh viện Nhi Trung Ương. Tốt nghiệp Đại học Y Hà Nội và có các chứng chỉ về hồi sức cấp cứu nhi khoa, tiêm chủng mở rộng và phát triển trẻ em toàn diện. Được bệnh nhân và đồng nghiệp đánh giá cao vì sự tận tâm và chuyên môn vững vàng.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Nhi Trung Ương',
        specialty_id: 2,
        picture:
          'https://www.vinmec.com/static/uploads/small_20_06_2023_05_41_48_828145_jpeg_8ee5a8d83b.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.tranthihuyen',
        email: 'bs.tranthihuyen@clinic.vn',
        phone: '0900000005',
        fullname: 'Trần Thị Huyền',
        gender: false,
        dob: '1987-04-19',
        address: 'Số 78, Đường Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM',
        experience: 10,
        about_me:
          'Bác sĩ chuyên khoa Nhi, tốt nghiệp Đại học Y Dược Huế. Có hơn 10 năm kinh nghiệm công tác tại Bệnh viện Phụ sản Nhi Đà Nẵng. Đặc biệt chuyên sâu trong điều trị các bệnh hô hấp, tiêu hóa, dinh dưỡng và sốt siêu vi ở trẻ em. Được đào tạo liên tục trong và ngoài nước.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Phụ sản Nhi Đà Nẵng',
        specialty_id: 2,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2021/03/bac-si-cam-ngoc-phuong.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.letrunghieu',
        email: 'bs.letrunghieu@clinic.vn',
        phone: '0900000006',
        fullname: 'Lê Trung Hiếu',
        gender: true,
        dob: '1979-12-12',
        address:
          'Số 55, Đường Nguyễn Hữu Thọ, Phường Hòa Thuận Tây, Hải Châu, Đà Nẵng',
        experience: 17,
        about_me:
          'Bác sĩ chuyên khoa Tai - Mũi - Họng với hơn 17 năm kinh nghiệm tại Bệnh viện Tai Mũi Họng Trung ương. Tốt nghiệp Đại học Y Hà Nội. Đã thực hiện thành công hàng ngàn ca phẫu thuật nội soi xoang mũi và thanh quản. Tham gia đào tạo tại Pháp và Hàn Quốc về kỹ thuật điều trị ngưng thở khi ngủ và điều trị viêm mũi dị ứng.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Tai Mũi Họng Trung ương',
        specialty_id: 3,
        picture:
          'https://www.vinmec.com/static/uploads/small_20_06_2023_06_00_22_191160_jpeg_5c37ea6abc.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.dothimai',
        email: 'bs.dothimai@clinic.vn',
        phone: '0900000007',
        fullname: 'Đỗ Thị Mai',
        gender: false,
        dob: '1985-11-30',
        address:
          'Số 101, Đường Nguyễn Lương Bằng, Phường Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng',
        experience: 12,
        about_me:
          'Bác sĩ chuyên khoa Tai - Mũi - Họng, tốt nghiệp Đại học Y Hà Nội. Hơn 12 năm kinh nghiệm trong chẩn đoán và điều trị các bệnh lý tai giữa, viêm xoang mãn tính và dị hình vách ngăn mũi. Được đào tạo chuyên sâu tại Nhật Bản và là thành viên tích cực của Hội Tai Mũi Họng Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Đa khoa Medlatec',
        specialty_id: 3,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bs-tran-thi-thuy-hang.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.ngovanhau',
        email: 'bs.ngovanhau@clinic.vn',
        phone: '0900000008',
        fullname: 'Ngô Văn Hậu',
        gender: true,
        dob: '1972-02-02',
        address: 'Số 6, Đường Nguyễn Trãi, Phường 5, TP Biên Hòa, Đồng Nai',
        experience: 20,
        about_me:
          'Phó Giáo sư, Tiến sĩ Y học chuyên khoa Tim mạch với hơn 20 năm kinh nghiệm. Giảng viên cao cấp tại Đại học Y Dược TP.HCM. Từng chủ trì nhiều đề tài nghiên cứu cấp quốc gia về bệnh lý mạch vành và can thiệp động mạch. Đạt giải thưởng Bác sĩ tiêu biểu toàn quốc năm 2020.',
        doctor_level: DoctorLevel.PGS,
        workplace: 'Bệnh viện Tim Tâm Đức',
        specialty_id: 4,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2021/03/giao-su-tran-quan-anh.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.vuthihang',
        email: 'bs.vuthihang@clinic.vn',
        phone: '0900000009',
        fullname: 'Vũ Thị Hằng',
        gender: false,
        dob: '1981-09-21',
        address:
          'Số 45, Đường Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP.HCM',
        experience: 15,
        about_me:
          'Bác sĩ chuyên khoa Tim mạch, tốt nghiệp Đại học Y Dược TP.HCM. Có hơn 15 năm kinh nghiệm điều trị suy tim và rối loạn nhịp. Tác giả của 3 công trình nghiên cứu đăng trên tạp chí Y học Việt Nam. Được mời tham luận tại Hội nghị Tim mạch Châu Á năm 2022.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Đại học Y Dược',
        specialty_id: 4,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/tran-thi-thanh-nga-avatar.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.dinhminhkhoi',
        email: 'bs.dinhminhkhoi@clinic.vn',
        phone: '0900000010',
        fullname: 'Đinh Minh Khôi',
        gender: true,
        dob: '1980-08-08',
        address: 'Số 10, Đường Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP.HCM',
        experience: 15,
        about_me:
          'Bác sĩ chuyên khoa Da liễu với hơn 15 năm kinh nghiệm điều trị các bệnh lý da. Tốt nghiệp loại giỏi Đại học Y Dược Huế. Tham gia các khoá đào tạo quốc tế về Laser thẩm mỹ tại Hàn Quốc và Thái Lan. Đồng tác giả cuốn “Atlas da liễu lâm sàng”.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Da Liễu TW',
        specialty_id: 5,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2023/04/pham-hung-cuong.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.hoangthingoc',
        email: 'bs.hoangthingoc@clinic.vn',
        phone: '0900000011',
        fullname: 'Hoàng Thị Ngọc',
        gender: false,
        dob: '1986-10-10',
        address:
          'Số 14, Đường Cách Mạng Tháng Tám, Phường Quang Vinh, TP Biên Hòa, Đồng Nai',
        experience: 11,
        about_me:
          'Bác sĩ Da liễu nổi tiếng với các phương pháp điều trị mụn trứng cá nặng và sẹo rỗ. Giảng viên da liễu tại Đại học Y Dược Huế. Thường xuyên tham gia hội thảo thẩm mỹ nội khoa toàn quốc.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Ngọc Ánh',
        specialty_id: 5,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2025/02/pham-thi-le-quyen.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.trananhdung',
        email: 'bs.trananhdung@clinic.vn',
        phone: '0900000012',
        fullname: 'Trần Anh Dũng',
        gender: true,
        dob: '1977-06-06',
        address:
          'Số 82, Đường Trần Quang Khải, Phường Xương Huân, Nha Trang, Khánh Hòa',
        experience: 19,
        about_me:
          'Bác sĩ chuyên khoa Cơ xương khớp với gần 20 năm kinh nghiệm tại Bệnh viện Chấn thương chỉnh hình. Đồng tác giả của nhiều công trình nghiên cứu về thoát vị đĩa đệm và phẫu thuật thay khớp gối. Là thành viên tích cực của Hội Cơ Xương Khớp Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Chấn thương chỉnh hình',
        specialty_id: 6,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2023/09/bs-tran-van-hinh-avt.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.lythithanh',
        email: 'bs.lythithanh@clinic.vn',
        phone: '0900000013',
        fullname: 'Lý Thị Thanh',
        gender: false,
        dob: '1982-03-03',
        address: 'Số 9, Đường 3/2, Phường Xuân Khánh, Ninh Kiều, Cần Thơ',
        experience: 14,
        about_me:
          'Chuyên gia vật lý trị liệu và phục hồi chức năng. Hơn 14 năm điều trị bệnh lý cột sống, cơ khớp. Là diễn giả thường xuyên tại hội nghị Vật lý trị liệu Đông Nam Á. Được trao bằng khen của Bộ Y tế vì thành tích phục hồi cho bệnh nhân sau đột quỵ.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám ACC',
        specialty_id: 6,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/nguyen-thi-ha-ts.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.nguyenvanlong',
        email: 'bs.nguyenvanlong@clinic.vn',
        phone: '0900000022',
        fullname: 'Nguyễn Văn Long',
        gender: true,
        dob: '1980-07-07',
        address:
          'Số 90, Đường Nguyễn Văn Linh, Phường Nam Dương, Hải Châu, Đà Nẵng',
        experience: 15,
        about_me:
          'Bác sĩ chuyên khoa Răng - Hàm - Mặt tổng quát với hơn 15 năm kinh nghiệm. Tốt nghiệp Đại học Y Dược TP.HCM, từng công tác tại nhiều trung tâm nha khoa quốc tế. Đặc biệt chuyên sâu trong điều trị phục hình răng sứ và tẩy trắng thẩm mỹ. Thành viên Hội Nha khoa thẩm mỹ Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Nha khoa Paris',
        specialty_id: 11,
        picture:
          'https://www.vinmec.com/static/uploads/small_bac_si_doan_quoc_hung_a3815f16eb.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.phamthituyet',
        email: 'bs.phamthituyet@clinic.vn',
        phone: '0900000023',
        fullname: 'Phạm Thị Tuyết',
        gender: false,
        dob: '1984-09-09',
        address: 'Số 134, Đường Nguyễn Văn Cừ, Phường 2, Quận 5, TP.HCM',
        experience: 14,
        about_me:
          'Bác sĩ chỉnh nha với hơn 14 năm kinh nghiệm. Tốt nghiệp Đại học Y Dược Huế. Có chứng chỉ chuyên sâu về niềng răng Invisalign và chỉnh hình xương hàm mặt tại Đại học Harvard. Tác giả bài nghiên cứu “Ảnh hưởng lực kéo trong chỉnh nha” đăng trên Tạp chí Nha khoa Quốc tế.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Nha khoa Việt Pháp',
        specialty_id: 11,
        picture:
          'https://www.vinmec.com/static/uploads/small_bac_si_pham_ba_nha_a827d78ac8.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.tranvanloc',
        email: 'bs.tranvanloc@clinic.vn',
        phone: '0900000024',
        fullname: 'Trần Văn Lộc',
        gender: true,
        dob: '1973-11-11',
        address:
          'Số 18, Đường Hà Nội, Phường Thủy Biều, TP Huế, Thừa Thiên Huế',
        experience: 22,
        about_me:
          'Giáo sư, Tiến sĩ chuyên khoa Ung bướu. Hơn 22 năm làm việc tại Bệnh viện Ung Bướu TP.HCM. Chủ trì nhiều đề tài nghiên cứu ung thư vú và ung thư phổi. Được trao giải thưởng Nhà khoa học tiêu biểu năm 2021. Là cố vấn chuyên môn cho các chương trình tầm soát ung thư quốc gia.',
        doctor_level: DoctorLevel.GS,
        workplace: 'Bệnh viện Ung Bướu TP.HCM',
        specialty_id: 12,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2021/03/bac-si-vu-le-chuyen.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.vothilan',
        email: 'bs.vothilan@clinic.vn',
        phone: '0900000025',
        fullname: 'Võ Thị Lan',
        gender: false,
        dob: '1981-06-06',
        address: 'Số 21, Đường Kim Mã, Phường Ngọc Khánh, Ba Đình, Hà Nội',
        experience: 16,
        about_me:
          'Thạc sĩ Y học chuyên ngành Ung bướu. Hơn 16 năm điều trị hóa xạ trị và chăm sóc giảm nhẹ cho bệnh nhân ung thư. Có chứng chỉ xạ trị nâng cao tại Pháp và Mỹ. Tham gia nhiều chương trình đào tạo bác sĩ tuyến dưới.',
        doctor_level: DoctorLevel.THS,
        workplace: 'Bệnh viện Chợ Rẫy',
        specialty_id: 12,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bs-tran-thi-thuy-hang.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.nguyenvanson',
        email: 'bs.nguyenvanson@clinic.vn',
        phone: '0900000026',
        fullname: 'Nguyễn Văn Sơn',
        gender: true,
        dob: '1979-03-03',
        address:
          'Số 77, Đường Lê Lợi, Phường Vĩnh Ninh, TP Huế, Thừa Thiên Huế',
        experience: 18,
        about_me:
          'Bác sĩ chuyên khoa Hô hấp. Tốt nghiệp Đại học Y Hà Nội và có chứng chỉ quốc tế về điều trị hen suyễn và bệnh phổi tắc nghẽn mãn tính. Được mời làm chuyên gia tư vấn hô hấp cho chương trình “Sống khoẻ cùng chuyên gia”.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Phổi Trung ương',
        specialty_id: 13,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bac-si-tran-quang-binh.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.lethibich',
        email: 'bs.lethibich@clinic.vn',
        phone: '0900000027',
        fullname: 'Lê Thị Bích',
        gender: false,
        dob: '1987-07-07',
        address: 'Số 88, Đường Lê Duẩn, Phường Bến Thành, Quận 1, TP.HCM',
        experience: 12,
        about_me:
          'Bác sĩ chuyên khoa Hô hấp, với 12 năm công tác tại các bệnh viện lớn. Chuyên điều trị viêm phổi, viêm phế quản mãn tính. Tốt nghiệp loại giỏi Đại học Y Dược Hải Phòng. Từng tham gia các chương trình đào tạo liên kết với Úc về chăm sóc hô hấp.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Đa khoa Hồng Ngọc',
        specialty_id: 13,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/chu-thi-hanh.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.phanvanquy',
        email: 'bs.phanvanquy@clinic.vn',
        phone: '0900000028',
        fullname: 'Phan Văn Quý',
        gender: true,
        dob: '1983-08-08',
        address: 'Số 11, Đường Phạm Hùng, Phường Hưng Phú, Cái Răng, Cần Thơ',
        experience: 14,
        about_me:
          'Bác sĩ chuyên khoa Thận - Tiết niệu, với 14 năm kinh nghiệm. Tốt nghiệp Đại học Y Dược Huế. Có chuyên môn về phẫu thuật nội soi tiết niệu, điều trị sỏi thận và các bệnh lý tuyến tiền liệt. Tác giả nhiều bài viết trên tạp chí y học chuyên ngành.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Trung ương Huế',
        specialty_id: 14,
        picture:
          'https://www.vinmec.com/static/uploads/small_20_06_2023_05_53_31_732124_jpeg_390b008206.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.dangthile',
        email: 'bs.dangthile@clinic.vn',
        phone: '0900000029',
        fullname: 'Đặng Thị Lệ',
        gender: false,
        dob: '1990-09-09',
        address:
          'Số 58, Đường Nguyễn Thiện Thuật, Phường Tân Lập, Nha Trang, Khánh Hòa',
        experience: 9,
        about_me:
          'Bác sĩ trẻ đầy nhiệt huyết chuyên khoa Thận - Tiết niệu. Tốt nghiệp xuất sắc Đại học Y Dược Huế. Đã điều trị thành công nhiều ca viêm đường tiết niệu tái phát và sỏi niệu quản. Từng tu nghiệp tại Singapore chuyên sâu về tiết niệu nữ.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Thành phố Huế',
        specialty_id: 14,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bac-si-giang-huynh-nhu.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.truongvanhai',
        email: 'bs.truongvanhai@clinic.vn',
        phone: '0900000030',
        fullname: 'Trương Văn Hải',
        gender: true,
        dob: '1976-04-04',
        address:
          'Số 88, Đường Tràng Tiền, Phường Tràng Tiền, Hoàn Kiếm, Hà Nội',
        experience: 20,
        about_me:
          'Bác sĩ chuyên khoa Lão khoa. Hơn 20 năm kinh nghiệm chăm sóc người cao tuổi. Là người đi đầu trong các chương trình tư vấn sức khoẻ cộng đồng cho người già. Tốt nghiệp Đại học Y Hà Nội và có bằng Thạc sĩ Lão khoa tại Nhật Bản.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Lão khoa Trung ương',
        specialty_id: 15,
        picture:
          'https://www.vinmec.com/static/uploads/small_28_02_2019_09_02_38_828416_jpeg_5ee29e2e57.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.nguyenthihanh',
        email: 'bs.nguyenthihanh@clinic.vn',
        phone: '0900000031',
        fullname: 'Nguyễn Thị Hạnh',
        gender: false,
        dob: '1985-12-12',
        address:
          'Số 102, Đường Hùng Vương, Phường Phước Tiến, Nha Trang, Khánh Hòa',
        experience: 13,
        about_me:
          'Bác sĩ Lão khoa, tốt nghiệp Đại học Y Dược Cần Thơ. 13 năm kinh nghiệm điều trị sa sút trí tuệ và rối loạn vận động ở người già. Đã tham gia nhiều chương trình đào tạo y học lão khoa nâng cao tại Hàn Quốc và Đức.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Gia An 115',
        specialty_id: 15,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/tran-thi-thanh-nga-avatar.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.phanthikim',
        email: 'bs.phanthikim@clinic.vn',
        phone: '0900000019',
        fullname: 'Phan Thị Kim',
        gender: false,
        dob: '1988-08-08',
        address: 'Số 12, Đường Hàm Nghi, Phường Vĩnh Trung, Thanh Khê, Đà Nẵng',
        experience: 10,
        about_me:
          'Bác sĩ chuyên khoa Thần kinh trẻ tuổi, tốt nghiệp Đại học Y Dược TP.HCM. Có kinh nghiệm chẩn đoán và điều trị rối loạn lo âu, trầm cảm và động kinh. Thành viên của Hội Thần kinh học Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Tâm Thần Trung ương',
        specialty_id: 9,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2024/10/nguyen-chinh-nghia-avt.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.vuducthanh',
        email: 'bs.vuducthanh@clinic.vn',
        phone: '0900000020',
        fullname: 'Vũ Đức Thành',
        gender: true,
        dob: '1982-12-12',
        address: 'Số 34, Đường Mậu Thân, Phường An Phú, Ninh Kiều, Cần Thơ',
        experience: 13,
        about_me:
          'Bác sĩ chuyên khoa Mắt, tốt nghiệp Đại học Y Dược TP.HCM. Có 13 năm kinh nghiệm phẫu thuật đục thủy tinh thể và điều trị cận thị bằng phương pháp Lasik. Thành viên Hội Nhãn khoa Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Mắt TP.HCM',
        specialty_id: 10,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2024/04/nguyen-quang-doi.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.buithihoa',
        email: 'bs.buithihoa@clinic.vn',
        phone: '0900000021',
        fullname: 'Bùi Thị Hoa',
        gender: false,
        dob: '1985-05-25',
        address:
          'Số 19, Đường Hùng Vương, Phường Phú Nhuận, TP Huế, Thừa Thiên Huế',
        experience: 12,
        about_me:
          'Bác sĩ chuyên về nhãn nhi và lão thị. Hơn 12 năm công tác tại Bệnh viện Mắt Sài Gòn. Tham gia nhiều chiến dịch khám mắt cộng đồng cho người già và trẻ em vùng sâu vùng xa.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Mắt Sài Gòn',
        specialty_id: 10,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2025/08/phan-quoc-hoan-avatar.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.tranminhhang',
        email: 'bs.tranminhhang@clinic.vn',
        phone: '0900000015',
        fullname: 'Trần Minh Hằng',
        gender: false,
        dob: '1983-01-01',
        address:
          'Số 17, Đường Tôn Đức Thắng, Phường Quốc Tử Giám, Đống Đa, Hà Nội',
        experience: 13,
        about_me:
          'Thạc sĩ Sản phụ khoa, tốt nghiệp Đại học Y Hà Nội. Hơn 13 năm kinh nghiệm theo dõi và điều trị thai kỳ nguy cơ cao. Từng tham gia các chương trình hỗ trợ sản phụ vùng cao và là giảng viên đào tạo tiền sản tại trung tâm y tế cộng đồng.',
        doctor_level: DoctorLevel.THS,
        workplace: 'Bệnh viện Bạch Mai',
        specialty_id: 7,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bac-si-nguyen-ba-my-nhi-detail-8.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.nguyenhuutai',
        email: 'bs.nguyenhuutai@clinic.vn',
        phone: '0900000016',
        fullname: 'Nguyễn Hữu Tài',
        gender: true,
        dob: '1985-05-05',
        address:
          'Số 99, Đường Giải Phóng, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
        experience: 12,
        about_me:
          'Bác sĩ chuyên khoa Tiêu hóa, tốt nghiệp Đại học Y Dược Cần Thơ. Hơn 12 năm kinh nghiệm nội soi tiêu hóa, điều trị viêm loét dạ dày và trào ngược thực quản. Từng tu nghiệp tại Nhật Bản và là hội viên của Hội Tiêu hoá Gan mật Việt Nam.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Bệnh viện Đại học Y Dược Cần Thơ',
        specialty_id: 8,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2011/01/bac-si-do-minh-hung.jpg',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
      {
        username: 'bs.lethithao',
        email: 'bs.lethithao@clinic.vn',
        phone: '0900000017',
        fullname: 'Lê Thị Thảo',
        gender: false,
        dob: '1990-02-20',
        address:
          'Số 17, Đường Trần Phú, Phường Vạn Thắng, Nha Trang, Khánh Hòa',
        experience: 8,
        about_me:
          'Bác sĩ nội soi tiêu hóa trẻ tuổi, tốt nghiệp xuất sắc Đại học Y Dược TP.HCM. Có chứng chỉ điều trị viêm đại tràng, viêm gan B, C và bệnh lý gan nhiễm mỡ. Tác giả nghiên cứu về ảnh hưởng của chế độ ăn lên viêm dạ dày mãn tính.',
        doctor_level: DoctorLevel.DK,
        workplace: 'Phòng khám Hoà Hảo',
        specialty_id: 8,
        picture:
          'https://tamanhhospital.vn/wp-content/uploads/2021/03/bac-si-cam-ngoc-phuong.png',
        password:
          '$2a$10$QnS2fVi3VcKerXBdsN/SH.eauZDvKPbf7S09s02BDtDzsMEzGWAMK',
      },
    ];

    for (let i = 0; i < doctors.length; i++) {
      const id = i + 7;
      const {
        username,
        email,
        phone,
        fullname,
        gender,
        dob,
        address,
        experience,
        about_me,
        doctor_level,
        workplace,
        specialty_id,
        picture,
        password,
      } = doctors[i];

      await queryRunner.query(`
                                                          INSERT INTO "users" ("id","username", "email", "password", "phone", "fullname", "gender", "date_of_birth", "picture", "address", "isAdmin")
                                                          VALUES (${id},'${username}', '${email}', '${password}', '${phone}', '${fullname}', ${gender}, '${dob}', '${picture}', '${address}', false)
                                                        `);

      await queryRunner.query(
        `INSERT INTO "user_roles" ("user_id", "role_id") VALUES (${id}, 2)`,
      );
      await queryRunner.query(`
                                                          INSERT INTO "doctors" ("experience", "about_me","doctor_level", "workplace", "specialty_id", "user_id")
                                                          VALUES (${experience}, '${about_me}','${doctor_level}', '${workplace}', ${specialty_id}, '${id}')
                                                        `);
    }

    //Dữ liệu về lịch trình bác sĩ
    const workingDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const workingHours = [
      { start_time: '08:00', end_time: '09:00' },
      { start_time: '09:30', end_time: '10:30' },
      { start_time: '11:00', end_time: '12:00' },
      { start_time: '14:00', end_time: '15:00' },
      { start_time: '15:30', end_time: '16:30' },
      { start_time: '17:00', end_time: '18:00' },
    ];

    for (let i = 0; i < doctors.length; i++) {
      const doctorId = i + 1;

      for (const day of workingDays) {
        for (const slot of workingHours) {
          await queryRunner.query(`
                                                                      INSERT INTO "doctor_schedules" ("day_of_week","start_time","end_time","is_active","doctor_id") VALUES
                                                                      ('${day}','${slot.start_time}','${slot.end_time}',true,${doctorId})  
                                                                      `);
        }
      }
    }

    //Dữ liệu về topics
    const topics = [
      {
        name: 'Sức khỏe tim mạch',
        description: 'Chủ đề về sức khỏe tim mạch',
        slug: 'suc-khoe-tim-mach',
      },
      {
        name: 'Dinh dưỡng',
        description: 'Chủ đề về dinh dưỡng',
        slug: 'dinh-duong',
      },
      {
        name: 'Tiêu hóa',
        description: 'Chủ đề về tiêu hóa',
        slug: 'tieu-hoa',
      },
      {
        name: 'Thần kinh',
        description: 'Chủ đề về thần kinh',
        slug: 'than-kinh',
      },
      {
        name: 'Phụ sản',
        description: 'Chủ đề về phụ sản',
        slug: 'phu-san',
      },
      {
        name: 'Tai - Mũi - Họng',
        description: 'Chủ đề về tai - mũi - họng',
        slug: 'tai---mui---hong',
      },
      {
        name: 'Da liễu',
        description: 'Chủ đề về da liễu',
        slug: 'da-lieu',
      },
      {
        name: 'Chăm sóc mắt',
        description: 'Chủ đề về chăm sóc mắt',
        slug: 'cham-soc-mat',
      },
      {
        name: 'Cơ xương khớp',
        description: 'Chủ đề về cơ xương khớp',
        slug: 'co-xuong-khop',
      },
      {
        name: 'Lão khoa',
        description: 'Chủ đề về lão khoa',
        slug: 'lao-khoa',
      },
      {
        name: 'Răng - Hàm - Mặt',
        description: 'Chủ đề về răng - hàm - mặt',
        slug: 'rang---ham---mat',
      },
      {
        name: 'Ung bướu',
        description: 'Chủ đề về ung bướu',
        slug: 'ung-buou',
      },
      {
        name: 'Tiểu đường',
        description: 'Chủ đề về tiểu đường',
        slug: 'tieu-đuong',
      },
      {
        name: 'Chăm sóc trẻ em',
        description: 'Chủ đề về chăm sóc trẻ em',
        slug: 'cham-soc-tre-em',
      },
      {
        name: 'Nam khoa',
        description: 'Chủ đề về nam khoa',
        slug: 'nam-khoa',
      },
      {
        name: 'Y học cổ truyền',
        description: 'Chủ đề về y học cổ truyền',
        slug: 'y-hoc-co-truyen',
      },
      {
        name: 'Tâm thần',
        description: 'Chủ đề về tâm thần',
        slug: 'tam-than',
      },
      {
        name: 'Phục hồi chức năng',
        description: 'Chủ đề về phục hồi chức năng',
        slug: 'phuc-hoi-chuc-nang',
      },
      {
        name: 'Thận - Tiết niệu',
        description: 'Chủ đề về thận - tiết niệu',
        slug: 'than---tiet-nieu',
      },
      {
        name: 'Phòng bệnh',
        description: 'Chủ đề về phòng bệnh',
        slug: 'phong-benh',
      },
    ];
    for (let i = 0; i < topics.length; i++) {
      const { name, description, slug } = topics[i];

      await queryRunner.query(`
                                                          INSERT INTO "topics" ("name","description","slug") VALUES
                                                          ('${name}','${description}','${slug}')
                                                          `);
    }

    //Thêm dữ liệu về tags
    const tags = [
      {
        name: 'tư vấn',
        slug: 'tu-van',
      },
      {
        name: 'bệnh lý',
        slug: 'benh-ly',
      },
      {
        name: 'phòng ngừa',
        slug: 'phong-ngua',
      },
      {
        name: 'chẩn đoán',
        slug: 'chan-đoan',
      },
      {
        name: 'điều trị',
        slug: 'đieu-tri',
      },
      {
        name: 'dược phẩm',
        slug: 'duoc-pham',
      },
      {
        name: 'bài tập',
        slug: 'bai-tap',
      },
      {
        name: 'chế độ ăn',
        slug: 'che-đo-an',
      },
      {
        name: 'thực phẩm chức năng',
        slug: 'thuc-pham-chuc-nang',
      },
      {
        name: 'phẫu thuật',
        slug: 'phau-thuat',
      },
      {
        name: 'nội soi',
        slug: 'noi-soi',
      },
      {
        name: 'xét nghiệm',
        slug: 'xet-nghiem',
      },
      {
        name: 'triệu chứng',
        slug: 'trieu-chung',
      },
      {
        name: 'tái khám',
        slug: 'tai-kham',
      },
      {
        name: 'hướng dẫn',
        slug: 'huong-dan',
      },
      {
        name: 'bác sĩ khuyên dùng',
        slug: 'bac-si-khuyen-dung',
      },
      {
        name: 'trẻ em',
        slug: 'tre-em',
      },
      {
        name: 'người lớn tuổi',
        slug: 'nguoi-lon-tuoi',
      },
      {
        name: 'bà bầu',
        slug: 'ba-bau',
      },
      {
        name: 'hệ miễn dịch',
        slug: 'he-mien-dich',
      },
      {
        name: 'đột quỵ',
        slug: 'đot-quy',
      },
      {
        name: 'tim mạch',
        slug: 'tim-mach',
      },
      {
        name: 'lối sống lành mạnh',
        slug: 'loi-song-lanh-manh',
      },
      {
        name: 'giấc ngủ',
        slug: 'giac-ngu',
      },
      {
        name: 'căng thẳng',
        slug: 'cang-thang',
      },
      {
        name: 'trầm cảm',
        slug: 'tram-cam',
      },
      {
        name: 'béo phì',
        slug: 'beo-phi',
      },
      {
        name: 'ung thư',
        slug: 'ung-thu',
      },
      {
        name: 'dị ứng',
        slug: 'di-ung',
      },
      {
        name: 'da nhạy cảm',
        slug: 'da-nhay-cam',
      },
    ];

    for (let i = 0; i < tags.length; i++) {
      const { name, slug } = tags[i];

      await queryRunner.query(`
                                                          INSERT INTO "tags" ("name","slug") VALUES
                                                          ('${name}','${slug}')
                                                          `);
    }

    //Thêm dữ liệu bài viết
    const articles = [
      {
        title: 'Kiến thức y học số 1',
        content:
          'Đây là nội dung chi tiết của bài viết số 1, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 1 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-1',
        is_approve: true,
        topic_id: 7,
        author_id: 25,
      },
      {
        title: 'Kiến thức y học số 2',
        content:
          'Đây là nội dung chi tiết của bài viết số 2, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 2 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-2',
        is_approve: true,
        topic_id: 10,
        author_id: 18,
      },
      {
        title: 'Kiến thức y học số 3',
        content:
          'Đây là nội dung chi tiết của bài viết số 3, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 3 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-3',
        is_approve: true,
        topic_id: 2,
        author_id: 16,
      },
      {
        title: 'Kiến thức y học số 4',
        content:
          'Đây là nội dung chi tiết của bài viết số 4, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 4 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-4',
        is_approve: true,
        topic_id: 15,
        author_id: 2,
      },
      {
        title: 'Kiến thức y học số 5',
        content:
          'Đây là nội dung chi tiết của bài viết số 5, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 5 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-5',
        is_approve: true,
        topic_id: 20,
        author_id: 29,
      },
      {
        title: 'Kiến thức y học số 6',
        content:
          'Đây là nội dung chi tiết của bài viết số 6, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 6 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-6',
        is_approve: true,
        topic_id: 16,
        author_id: 1,
      },
      {
        title: 'Kiến thức y học số 7',
        content:
          'Đây là nội dung chi tiết của bài viết số 7, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 7 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-7',
        is_approve: true,
        topic_id: 7,
        author_id: 2,
      },
      {
        title: 'Kiến thức y học số 8',
        content:
          'Đây là nội dung chi tiết của bài viết số 8, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 8 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-8',
        is_approve: true,
        topic_id: 13,
        author_id: 28,
      },
      {
        title: 'Kiến thức y học số 9',
        content:
          'Đây là nội dung chi tiết của bài viết số 9, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 9 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-9',
        is_approve: true,
        topic_id: 3,
        author_id: 19,
      },
      {
        title: 'Kiến thức y học số 10',
        content:
          'Đây là nội dung chi tiết của bài viết số 10, tập trung vào chủ đề sức khỏe cộng đồng và phòng tránh bệnh tật.',
        summary: 'Tóm tắt bài viết 10 về kiến thức sức khỏe và y học.',
        slug: 'kien-thuc-y-hoc-so-10',
        is_approve: true,
        topic_id: 3,
        author_id: 12,
      },
    ];
    for (let i = 0; i < articles.length; i++) {
      const { title, content, summary, slug, is_approve, topic_id, author_id } =
        articles[i];
      await queryRunner.query(`
                                                          INSERT INTO "articles" ("title","content","summary","slug","is_approve","topic_id","author_id") VALUES
                                                          ('${title}','${content}','${summary}','${slug}','${is_approve}',${topic_id},${author_id})
                                                          `);
    }

    //Thêm dữ liệu article_tags
    const article_tags = [
      {
        article_id: 1,
        tag_id: 22,
      },
      {
        article_id: 1,
        tag_id: 2,
      },
      {
        article_id: 1,
        tag_id: 27,
      },
      {
        article_id: 1,
        tag_id: 10,
      },
      {
        article_id: 2,
        tag_id: 7,
      },
      {
        article_id: 2,
        tag_id: 29,
      },
      {
        article_id: 2,
        tag_id: 12,
      },
      {
        article_id: 2,
        tag_id: 20,
      },
      {
        article_id: 3,
        tag_id: 1,
      },
      {
        article_id: 3,
        tag_id: 26,
      },
      {
        article_id: 3,
        tag_id: 29,
      },
      {
        article_id: 4,
        tag_id: 21,
      },
      {
        article_id: 4,
        tag_id: 26,
      },
      {
        article_id: 4,
        tag_id: 19,
      },
      {
        article_id: 5,
        tag_id: 28,
      },
      {
        article_id: 5,
        tag_id: 20,
      },
      {
        article_id: 5,
        tag_id: 17,
      },
      {
        article_id: 5,
        tag_id: 15,
      },
      {
        article_id: 6,
        tag_id: 8,
      },
      {
        article_id: 6,
        tag_id: 11,
      },
      {
        article_id: 6,
        tag_id: 26,
      },
      {
        article_id: 6,
        tag_id: 24,
      },
      {
        article_id: 7,
        tag_id: 18,
      },
      {
        article_id: 7,
        tag_id: 2,
      },
      {
        article_id: 7,
        tag_id: 25,
      },
      {
        article_id: 7,
        tag_id: 28,
      },
      {
        article_id: 8,
        tag_id: 21,
      },
      {
        article_id: 8,
        tag_id: 15,
      },
      {
        article_id: 8,
        tag_id: 10,
      },
      {
        article_id: 9,
        tag_id: 10,
      },
      {
        article_id: 9,
        tag_id: 8,
      },
      {
        article_id: 9,
        tag_id: 23,
      },
      {
        article_id: 9,
        tag_id: 7,
      },
      {
        article_id: 9,
        tag_id: 16,
      },
      {
        article_id: 10,
        tag_id: 2,
      },
      {
        article_id: 10,
        tag_id: 22,
      },
      {
        article_id: 10,
        tag_id: 5,
      },
    ];

    for (let i = 0; i < article_tags.length; i++) {
      const { article_id, tag_id } = article_tags[i];
      await queryRunner.query(`
                                                          INSERT INTO "article_tags" ("article_id","tag_id") VALUES
                                                          (${article_id},${tag_id})
                                                          `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Xóa bảng liên kết/phụ thuộc trước
    await queryRunner.query(`DELETE FROM "article_tags"`);
    await queryRunner.query(`DELETE FROM "doctor_schedules"`);
    await queryRunner.query(`DELETE FROM "user_roles"`);
    await queryRunner.query(`DELETE FROM "health_profile"`);

    // 2. Xóa bảng sử dụng khóa ngoại
    await queryRunner.query(`DELETE FROM "doctors"`);
    await queryRunner.query(`DELETE FROM "articles"`);

    // 3. Xóa bảng gốc (cha)
    await queryRunner.query(`DELETE FROM "tags"`);
    await queryRunner.query(`DELETE FROM "topics"`);
    await queryRunner.query(`DELETE FROM "users"`);
    await queryRunner.query(`DELETE FROM "roles"`);
  }
}

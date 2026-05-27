"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _roleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/role.entity"));
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _userRoleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/userRole.entity"));
const _constants = require("../../utils/constants");
const _typeorm1 = require("typeorm");
const _usersmapper = require("./users.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let UsersService = class UsersService {
    findAll() {
        return this.userRepo.find();
    }
    async findByUsernameOrEmail(usernameOrEmail) {
        const user = await this.userRepo.findOne({
            where: [
                {
                    email: usernameOrEmail
                },
                {
                    username: usernameOrEmail
                }
            ],
            relations: [
                'roles',
                'roles.role'
            ]
        });
        return user;
    }
    async findByUserId(userId) {
        const user = await this.userRepo.findOne({
            where: {
                id: userId
            },
            relations: {
                roles: {
                    role: {
                        permissions: {
                            permission: true
                        }
                    }
                }
            }
        });
        return user;
    }
    async getUserProfile(userId) {
        const user = await this.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại');
        }
        return _usersmapper.UsersMapper.toUserProfileResponse(user);
    }
    async createUser(manager, username, email, fullname, password) {
        try {
            const isExistsUserByUsername = await this.isUserExistsByUsername(username);
            const isExistsUserByEmail = await this.isUserExistsByEmail(email);
            if (isExistsUserByUsername || isExistsUserByEmail) {
                throw new _common.ConflictException('Người dùng đã tồn tại');
            }
            const createdData = password ? {
                username,
                email,
                fullname,
                password
            } : {
                username,
                email,
                fullname
            };
            const createdUser = manager.create(_userentity.default, createdData);
            const newUser = await manager.save(_userentity.default, createdUser);
            const role = await manager.findOne(_roleentity.default, {
                where: {
                    role_name: _constants.ROLE_NAME.PATIENT
                }
            });
            if (!role) {
                throw new _common.NotFoundException('Role Patient mặc định không tồn tại!');
            }
            await manager.save(_userRoleentity.default, {
                user: newUser,
                role
            });
            return newUser;
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Người dùng đã tồn tại');
            }
            throw error;
        }
    }
    async updateUserField(userId, updateFieldName, updateFieldValue) {
        return this.userRepo.update(userId, {
            [updateFieldName]: updateFieldValue
        });
    }
    async updateUserFields(userId, updateFields) {
        return this.userRepo.update(userId, updateFields);
    }
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { search, role_id, arrange } = objectFilters;
        page = Math.max(page, 1);
        limit = Math.max(limit, 1);
        const skip = (page - 1) * limit;
        let where;
        const roleCondition = role_id ? {
            roles: {
                role: {
                    id: role_id
                }
            }
        } : {};
        const searchFields = [
            'username',
            'email',
            'fullname'
        ];
        if (search) {
            where = searchFields.map((field)=>({
                    [field]: (0, _typeorm1.ILike)(`%${search}%`),
                    ...roleCondition
                }));
        } else if (role_id) {
            where = roleCondition;
        }
        const [users, total] = await this.userRepo.findAndCount({
            where,
            relations: {
                roles: {
                    role: true
                }
            },
            order: {
                created_at: arrange.toUpperCase()
            },
            skip,
            take: limit
        });
        const result = new _paginationResultdto.PaginationResultDto('users', _usersmapper.UsersMapper.toUserListResponse(users), total, page, limit);
        return result;
    }
    async filterAndPaginationPatients(objectFilters) {
        let { page, limit } = objectFilters;
        const { search, arrange } = objectFilters;
        page = Math.max(page, 1);
        limit = Math.max(limit, 1);
        const skip = (page - 1) * limit;
        let where;
        const roleCondition = {
            roles: {
                role: {
                    role_name: _constants.ROLE_NAME.PATIENT
                }
            }
        };
        where = roleCondition;
        const searchFields = [
            'username',
            'email',
            'fullname'
        ];
        if (search) {
            where = searchFields.map((field)=>({
                    [field]: (0, _typeorm1.ILike)(`%${search}%`),
                    ...roleCondition
                }));
        }
        const [users, total] = await this.userRepo.findAndCount({
            where,
            relations: {
                roles: {
                    role: true
                }
            },
            order: {
                created_at: arrange.toUpperCase()
            },
            skip,
            take: limit
        });
        const result = new _paginationResultdto.PaginationResultDto('users', _usersmapper.UsersMapper.toUserListResponse(users), total, page, limit);
        return result;
    }
    async isUserExists(userId) {
        const user = await this.userRepo.findOne({
            where: {
                id: userId
            }
        });
        return !!user;
    }
    async getAdminUserDetail(userId) {
        const user = await this.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại');
        }
        return _usersmapper.UsersMapper.toUserProfileResponse(user);
    }
    async setLocking(userId, isLocking) {
        const user = await this.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại');
        }
        user.is_locking = isLocking;
        const updatedUser = await this.userRepo.save(user);
        return _usersmapper.UsersMapper.toUserProfileResponse(updatedUser);
    }
    async setActive(userId, isActive) {
        const user = await this.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại');
        }
        user.is_active = isActive;
        const updatedUser = await this.userRepo.save(user);
        return _usersmapper.UsersMapper.toUserProfileResponse(updatedUser);
    }
    async updateRoles(userId, roleIds) {
        return this.dataSource.transaction(async (manager)=>{
            const user = await manager.findOne(_userentity.default, {
                where: {
                    id: userId
                }
            });
            if (!user) {
                throw new _common.NotFoundException('Người dùng không tồn tại');
            }
            const uniqueRoleIds = [
                ...new Set(roleIds)
            ];
            if (!uniqueRoleIds.length) {
                throw new _common.NotFoundException('Danh sách vai trò không hợp lệ');
            }
            const roles = await manager.find(_roleentity.default, {
                where: {
                    id: (0, _typeorm1.In)(uniqueRoleIds)
                }
            });
            if (roles.length !== uniqueRoleIds.length) {
                throw new _common.NotFoundException('Danh sách vai trò có vai trò không tồn tại');
            }
            await manager.delete(_userRoleentity.default, {
                user: {
                    id: userId
                }
            });
            await manager.save(_userRoleentity.default, roles.map((role)=>({
                    user: {
                        id: userId
                    },
                    role
                })));
            const updatedUser = await manager.findOne(_userentity.default, {
                where: {
                    id: userId
                },
                relations: {
                    roles: {
                        role: {
                            permissions: {
                                permission: true
                            }
                        }
                    }
                }
            });
            return _usersmapper.UsersMapper.toUserProfileResponse(updatedUser);
        });
    }
    async isUserExistsByUsername(username) {
        const user = await this.userRepo.findOne({
            where: {
                username
            }
        });
        return !!user;
    }
    async isUserExistsByEmail(email) {
        const user = await this.userRepo.findOne({
            where: {
                email
            }
        });
        return !!user;
    }
    async numberOfUsersByAllRoles() {
        const count = await this.userRepo.count({});
        return count;
    }
    async numberOfUsersByRolePatientActive() {
        const count = await this.userRepo.count({
            where: {
                roles: {
                    role: {
                        role_name: _constants.ROLE_NAME.PATIENT
                    }
                },
                is_active: true
            }
        });
        return count;
    }
    async numberOfUsersByRoleDoctorActive() {
        const count = await this.userRepo.count({
            where: {
                roles: {
                    role: {
                        role_name: _constants.ROLE_NAME.DOCTOR
                    }
                },
                is_active: true
            }
        });
        return count;
    }
    constructor(userRepo, dataSource){
        this.userRepo = userRepo;
        this.dataSource = dataSource;
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_userentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map
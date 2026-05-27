"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelationshipsService", {
    enumerable: true,
    get: function() {
        return RelationshipsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
const _typeorm1 = require("typeorm");
const _relationshipsmapper = require("./relationships.mapper");
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
let RelationshipsService = class RelationshipsService {
    async create(body) {
        try {
            const { relationship_code, relationship_name } = body;
            const isRelationshipExistsByName = await this.isRelationshipExistsByName(relationship_name);
            const isRelationshipExistsByCode = await this.isRelationshipExistsByCode(relationship_code);
            if (isRelationshipExistsByName || isRelationshipExistsByCode) {
                throw new _common.ConflictException('Mối quan hệ đã tồn tại.');
            }
            const createdRelationship = this.relationshipRepo.create(body);
            const newRelationship = await this.relationshipRepo.save(createdRelationship);
            return _relationshipsmapper.RelationshipsMapper.toRelationshipResponseDto(newRelationship);
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Mối quan hệ đã tồn tại.');
            }
            throw error;
        }
    }
    async update(relationshipCode, bodyUpdateRelationship) {
        const relationship = await this.findByRelationshipCode(relationshipCode);
        if (bodyUpdateRelationship.relationship_name !== undefined && bodyUpdateRelationship.relationship_name !== relationship.relationship_name) {
            const existedRelationship = await this.relationshipRepo.createQueryBuilder('relationship').where('LOWER(relationship.relationship_name) = LOWER(:name)', {
                name: bodyUpdateRelationship.relationship_name
            }).andWhere('relationship.relationship_code != :relationshipCode', {
                relationshipCode
            }).getOne();
            if (existedRelationship) {
                throw new _common.ConflictException('Mối quan hệ đã tồn tại.');
            }
            relationship.relationship_name = bodyUpdateRelationship.relationship_name;
        }
        if (bodyUpdateRelationship.description !== undefined) {
            relationship.description = bodyUpdateRelationship.description;
        }
        const updatedRelationship = await this.relationshipRepo.save(relationship);
        return _relationshipsmapper.RelationshipsMapper.toRelationshipResponseDto(updatedRelationship);
    }
    async remove(relationshipCode) {
        await this.findByRelationshipCode(relationshipCode);
        await this.relationshipRepo.softDelete({
            relationship_code: relationshipCode
        });
        return {
            message: 'Xóa mối quan hệ thành công.'
        };
    }
    async getRelationshipDetail(relationshipCode) {
        const relationship = await this.relationshipRepo.findOne({
            where: {
                relationship_code: relationshipCode
            }
        });
        if (!relationship) {
            throw new _common.NotFoundException('Không tìm thấy mối quan hệ');
        }
        return _relationshipsmapper.RelationshipsMapper.toRelationshipResponseDto(relationship);
    }
    async filterAndPagination(objectFilters) {
        let { search, arrange, page, limit } = objectFilters;
        page = Math.max(page, 1);
        limit = Math.max(limit, 1);
        const skip = (page - 1) * limit;
        const query = this.relationshipRepo.createQueryBuilder('relationship').orderBy('relationship.relationship_name', arrange.toUpperCase()).skip(skip).take(limit);
        if (search) {
            query.where('relationship.relationship_name ILIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('relationship.description ILIKE :search', {
                search: `%${search}%`
            });
        }
        const [relationships, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('relationships', _relationshipsmapper.RelationshipsMapper.toRelationshipResponseDtoList(relationships), total, page, limit);
        return result;
    }
    async findByRelationshipCode(relationshipCode) {
        const relationship = await this.relationshipRepo.findOne({
            where: {
                relationship_code: relationshipCode
            }
        });
        if (!relationship) {
            throw new _common.NotFoundException('Không tìm thấy mối quan hệ');
        }
        return relationship;
    }
    async isRelationshipExistsByName(relationship_name) {
        const relationship = await this.relationshipRepo.findOne({
            where: {
                relationship_name
            }
        });
        return !!relationship;
    }
    async isRelationshipExistsByCode(relationship_code) {
        const relationship = await this.relationshipRepo.findOne({
            where: {
                relationship_code
            }
        });
        return !!relationship;
    }
    constructor(relationshipRepo){
        this.relationshipRepo = relationshipRepo;
    }
};
RelationshipsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_relationshipentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], RelationshipsService);

//# sourceMappingURL=relationships.service.js.map
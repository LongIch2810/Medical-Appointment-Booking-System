"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArticlesController", {
    enumerable: true,
    get: function() {
        return ArticlesController;
    }
});
const _common = require("@nestjs/common");
const _articlesservice = require("./articles.service");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateArticledto = require("./dto/request/bodyCreateArticle.dto");
const _bodyFilterArticlesdto = require("./dto/request/bodyFilterArticles.dto");
const _platformexpress = require("@nestjs/platform-express");
const _fileRequiredInterceptorinterceptor = require("../../common/interceptors/fileRequiredInterceptor.interceptor");
const _partialUpdateArticledto = require("./dto/request/partialUpdateArticle.dto");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
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
let ArticlesController = class ArticlesController {
    async createArticle(req, bodyCreateArticle, files) {
        const { userId } = req.user;
        const message = await this.articlesService.create(userId, bodyCreateArticle, files);
        return message;
    }
    async updateArticle(articleId, bodyUpdateArticle) {
        const { message } = await this.articlesService.updateArticle(articleId, bodyUpdateArticle);
        return message;
    }
    async deleteArticle(articleId) {
        const { message } = await this.articlesService.deleteArticle(articleId);
        return message;
    }
    async getArticleDetail(articleId) {
        const article = await this.articlesService.getArticle(articleId);
        return article;
    }
    async approveArticle(articleId) {
        const { message } = await this.articlesService.approveArticle(articleId);
        return message;
    }
    async getArticles(objectFilters) {
        return this.articlesService.filterAndPagination(objectFilters);
    }
    constructor(articlesService){
        this.articlesService = articlesService;
        this.logger = new _common.Logger(ArticlesController.name);
    }
};
_ts_decorate([
    (0, _common.Post)('create-article'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ARTICLE_CREATE),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'articles'
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 4, {
        limits: {
            files: 4
        }
    }), new _fileRequiredInterceptorinterceptor.FileRequiredInterceptor()),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.UploadedFiles)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyCreateArticledto.BodyCreateArticleDto === "undefined" ? Object : _bodyCreateArticledto.BodyCreateArticleDto,
        Array
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "createArticle", null);
_ts_decorate([
    (0, _common.Patch)(':articleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ARTICLE_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'articles'
    }),
    _ts_param(0, (0, _common.Param)('articleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _partialUpdateArticledto.PartialUpdateArticleDto === "undefined" ? Object : _partialUpdateArticledto.PartialUpdateArticleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "updateArticle", null);
_ts_decorate([
    (0, _common.Delete)(':articleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ARTICLE_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'articles'
    }),
    _ts_param(0, (0, _common.Param)('articleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "deleteArticle", null);
_ts_decorate([
    (0, _common.Get)(':articleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('articleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "getArticleDetail", null);
_ts_decorate([
    (0, _common.Put)(':articleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ARTICLE_APPROVE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'articles.approval'
    }),
    _ts_param(0, (0, _common.Param)('articleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "approveArticle", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterArticlesdto.BodyFilterArticlesDto === "undefined" ? Object : _bodyFilterArticlesdto.BodyFilterArticlesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ArticlesController.prototype, "getArticles", null);
ArticlesController = _ts_decorate([
    (0, _common.Controller)('articles'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _articlesservice.ArticlesService === "undefined" ? Object : _articlesservice.ArticlesService
    ])
], ArticlesController);

//# sourceMappingURL=articles.controller.js.map
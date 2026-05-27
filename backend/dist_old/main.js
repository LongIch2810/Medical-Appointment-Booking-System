"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _swagger = require("@nestjs/swagger");
const _appmodule = require("./app.module");
const _cookieparser = /*#__PURE__*/ _interop_require_default(require("cookie-parser"));
const _responseinterceptor = require("./common/interceptors/response.interceptor");
const _httpexceptionfilter = require("./common/filters/http-exception.filter");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _removeFieldPasswordinterceptor = require("./common/interceptors/removeFieldPassword.interceptor");
const _dateFormatInterceptorinterceptor = require("./common/interceptors/dateFormatInterceptor.interceptor");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    const configService = app.get(_config.ConfigService);
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
            'http://localhost:5000',
            'http://127.0.0.1:5000'
        ],
        credentials: true
    });
    app.use((0, _cookieparser.default)());
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new _removeFieldPasswordinterceptor.RemoveFieldPasswordInterceptor(), new _dateFormatInterceptorinterceptor.DateFormatInterceptor(), new _responseinterceptor.ResponseInterceptor());
    app.useGlobalFilters(new _httpexceptionfilter.HttpExceptionFilter());
    app.useGlobalPipes(new _common.ValidationPipe({
        transform: true,
        whitelist: true
    }));
    const config = new _swagger.DocumentBuilder().setTitle('System Booking Doctor').setDescription('API cho hệ thống đặt lịch khám bác sĩ').setVersion('1.0').build();
    const documentFactory = ()=>_swagger.SwaggerModule.createDocument(app, config);
    _swagger.SwaggerModule.setup('api-docs', app, documentFactory);
    await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();

//# sourceMappingURL=main.js.map
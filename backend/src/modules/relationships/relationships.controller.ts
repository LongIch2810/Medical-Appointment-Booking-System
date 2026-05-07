import { Body, Controller, Post } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { BodyFilterRelationshipsDto } from './dto/request/bodyFilterRelationships.dto';

@Controller('relationships')
export class RelationshipsController {
    constructor(
        private readonly relationshipsService: RelationshipsService
    ) { }

    @Post()
    async getFilterRelationships(@Body() objectFilters: BodyFilterRelationshipsDto) {
        const result = await this.relationshipsService.filterAndPagination(objectFilters);
        return result;
    }
}

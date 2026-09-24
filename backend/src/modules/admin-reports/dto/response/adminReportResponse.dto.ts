import { Exclude, Expose, Type } from 'class-transformer';

export class ReportAnalysisItemDto {
  @Expose()
  section_title!: string;

  @Expose()
  content!: string;
}

@Exclude()
export class ReportContentDto {
  @Expose()
  title!: string;

  @Expose()
  @Type(() => ReportAnalysisItemDto)
  analysis!: ReportAnalysisItemDto[];

  @Expose()
  insights!: string[];

  @Expose()
  strategic_recommendations!: string[];

  @Expose()
  economic_context!: string;

  @Expose()
  footer!: string;
}

@Exclude()
export class TableColumnDto {
  @Expose()
  key!: string;

  @Expose()
  label!: string;
}

@Exclude()
export class AdminReportResponseDto {
  @Expose()
  id!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  createdBy?: { id: number; fullname: string | null };

  @Expose()
  reportType!: string;

  @Expose()
  rangeLabel!: string;

  @Expose()
  sourceRequest!: string | null;

  @Expose()
  executedQuery!: string | null;

  @Expose()
  hasExecutedQuery!: boolean;

  @Expose()
  pdfUrl!: string | null;

  @Expose()
  fileName!: string | null;

  @Expose()
  @Type(() => ReportContentDto)
  report!: ReportContentDto | null;

  @Expose()
  chartConfig!: Record<string, unknown> | null;

  @Expose()
  @Type(() => TableColumnDto)
  tableColumns!: TableColumnDto[];

  @Expose()
  tableRows!: Record<string, string | number>[];
}
